/* =========================================================
   ATP VEHICLE STATUS
   SCRIPT.JS
   Google Apps Script + Google Sheets
========================================================= */

"use strict";


/* =========================================================
   SETTINGS
========================================================= */

const API_URL =
    "https://script.google.com/macros/s/AKfycbxgIpUfXZFD6RMwjAge6hJp4CVWmcv-l7tONH4LnMak-US8dqueJwzOupAjOnA2TKfL/exec";


/*
   الرقم السري العام للمشرف
*/
const SUPERVISOR_PASSWORD = "12345";


let vehicles = [];

let selectedVehicle = null;

let pendingAdminAction = null;


/* =========================================================
   SHORT SELECTOR
========================================================= */

const $ = id =>
    document.getElementById(id);


/* =========================================================
   SAFE EVENT BINDING
========================================================= */

function bindClick(id, handler) {

    const element = $(id);

    if (element) {
        element.addEventListener("click", handler);
    }

}


function bindEnter(id, handler) {

    const element = $(id);

    if (!element) {
        return;
    }

    element.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {
                handler();
            }

        }
    );

}


/* =========================================================
   PAGE START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateClock();

        setInterval(
            updateClock,
            1000
        );

        loadVehicles();


        bindClick(
            "editBtn",
            requestEdit
        );


        bindClick(
            "verifyBtn",
            verifyEdit
        );


        bindClick(
            "saveBtn",
            saveVehicle
        );


        bindClick(
            "confirmYesBtn",
            confirmUpdate
        );


        bindClick(
            "confirmNoBtn",
            closeConfirmModal
        );


        bindClick(
            "verifyAdminPasswordBtn",
            verifyAdminPassword
        );


        bindClick(
            "addVehicleBtn",
            openAddVehicle
        );


        bindClick(
            "deleteVehicleBtn",
            requestDeleteVehicle
        );


        bindClick(
            "saveNewVehicleBtn",
            saveNewVehicle
        );


        bindEnter(
            "supervisorPassword",
            verifyEdit
        );


        bindEnter(
            "adminPasswordInput",
            verifyAdminPassword
        );

    }
);


/* =========================================================
   PAGE VISIBILITY
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            !document.hidden
        ) {

            loadVehicles();

        }

    }
);


/* =========================================================
   DATE / TIME
========================================================= */

function updateClock() {

    const dateTime =
        $("dateTime");

    if (!dateTime) {
        return;
    }


    const now =
        new Date();


    const days = [
        "الأحد",
        "الإثنين",
        "الثلاثاء",
        "الأربعاء",
        "الخميس",
        "الجمعة",
        "السبت"
    ];


    const day =
        days[now.getDay()];


    const date =
        new Intl.DateTimeFormat(
            "ar-SA-u-ca-gregory",
            {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).format(now);


    const time =
        now.toLocaleTimeString(
            "ar-SA",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            }
        );


    dateTime.textContent =
        `${day} - ${date} - ${time}`;

}


/* =========================================================
   LOAD VEHICLES
========================================================= */

async function loadVehicles() {

    try {

        if (
            !API_URL ||
            API_URL.includes("ضع_رابط")
        ) {

            vehicles =
                createDemoVehicles();

            renderVehicles();

            return;
        }


        const response =
            await fetch(
                `${API_URL}?action=getVehicles&_=${Date.now()}`,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "تعذر الاتصال بالخادم"
            );

        }


       const data = await response.json();

console.log("Google Apps Script Response:", data);

if (data.ok === false) {

    throw new Error(
        data.message ||
        "Google Apps Script returned an error."
    );
}

const receivedVehicles =
    Array.isArray(data)
        ? data
        : Array.isArray(data.vehicles)
            ? data.vehicles
            : [];

console.log(
    "Vehicles received:",
    receivedVehicles
);

vehicles =
    normalizeVehicles(
        receivedVehicles
    );

renderVehicles();

    }

    catch (error) {

        console.error(
            "loadVehicles:",
            error
        );


        const grid =
            $("vehicleGrid");


        if (grid) {

            grid.innerHTML =
                `
                <div class="loading">
                    تعذر تحميل بيانات المركبات.
                    تحقق من الاتصال بالخادم.
                </div>
                `;

        }

    }

}


/* =========================================================
   NORMALIZE
========================================================= */

function normalizeVehicles(list) {

    return list.map(
        (v, i) => {

            return {

                id:
                    v.id ??
                    v.row ??
                    i + 2,


                serial:
                    v.serial ??
                    v.SN ??
                    i + 1,


                number:
                    v.number ??
                    v.vehicleNumber ??
                    v.VN ??
                    "",


                type:
                    v.type ??
                    v.vehicleType ??
                    "",


                driver:
                    v.driver ??
                    v.driverName ??
                    v.DN ??
                    "",


                vehicleStatus:
                    normalizeVehicleStatus(
                        v.vehicleStatus ??
                        v.status ??
                        v.VC
                    ),


                driverStatus:
                    normalizeDriverStatus(
                        v.driverStatus ??
                        v.DC
                    ),


                maintenance:
                    normalizeMaintenance(
                        v.maintenance ??
                        v.maintenanceStatus
                    ),


                notes:
                    v.notes ??
                    "",


                updatedAt:
                    v.updatedAt ??
                    v.updated ??
                    v.time ??
                    "",


                password:
                    v.password ??
                    v.vehiclePassword ??
                    ""

            };

        }
    );

}


/* =========================================================
   STATUS NORMALIZATION
========================================================= */

function normalizeVehicleStatus(value) {

    const s =
        String(value ?? "")
            .toLowerCase()
            .trim();


    if (
        [
            "working",
            "تعمل",
            "1",
            "true"
        ].includes(s)
    ) {

        return "working";

    }


    return "stopped";

}


function normalizeDriverStatus(value) {

    const s =
        String(value ?? "")
            .toLowerCase()
            .trim();


    if (
        [
            "present",
            "حاضر",
            "1",
            "true"
        ].includes(s)
    ) {

        return "present";

    }


    return "absent";

}


function normalizeMaintenance(value) {

    const s =
        String(value ?? "")
            .toLowerCase()
            .trim();


    if (
        [
            "routine",
            "صيانة دورية"
        ].includes(s)
    ) {

        return "routine";

    }


    if (
        [
            "emergency",
            "صيانة طارئة"
        ].includes(s)
    ) {

        return "emergency";

    }


    return "none";

}


/* =========================================================
   DEMO DATA
========================================================= */

function createDemoVehicles() {

    const result = [];


    for (
        let i = 1;
        i <= 68;
        i++
    ) {

        result.push({

            id: i + 1,

            serial: i,

            number:
                String(i).padStart(
                    3,
                    "0"
                ),

            type: "",

            driver: "",

            vehicleStatus:
                "working",

            driverStatus:
                "absent",

            maintenance:
                "none",

            notes: "",

            updatedAt: "",

            password: ""

        });

    }


    return result;

}


/* =========================================================
   RENDER VEHICLES
========================================================= */

function renderVehicles() {

    const grid =
        $("vehicleGrid");


    if (!grid) {
        return;
    }


    grid.innerHTML = "";


    if (!vehicles.length) {

        grid.innerHTML =
            `
            <div class="loading">
                لا توجد مركبات مسجلة.
            </div>
            `;

        return;
    }


    vehicles.forEach(
        vehicle => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                `vehicle-row ${getRowClass(vehicle)}`;


            row.setAttribute(
                "role",
                "button"
            );


            row.tabIndex = 0;


            row.title =
                `تحديث حالة المركبة ${
                    vehicle.number ||
                    vehicle.serial
                }`;


            row.addEventListener(
                "click",
                () => askUpdate(vehicle)
            );


            row.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        event.preventDefault();

                        askUpdate(vehicle);

                    }

                }
            );


            row.innerHTML = `

                <div>
                    ${escapeHtml(
                        vehicle.serial
                    )}
                </div>


                <div>
                    <strong>
                        ${escapeHtml(
                            vehicle.number || "—"
                        )}
                    </strong>
                </div>


                <div class="
                    ${
                        vehicle.vehicleStatus === "working"
                            ? "status-working"
                            : "status-stopped"
                    }
                ">

                    ${
                        vehicle.vehicleStatus === "working"
                            ? "تعمل"
                            : "لا تعمل"
                    }

                </div>


                <div>
                    ${escapeHtml(
                        vehicle.driver || "—"
                    )}
                </div>


                <div class="
                    ${
                        vehicle.driverStatus === "present"
                            ? "driver-present"
                            : "driver-absent"
                    }
                ">

                    ${
                        vehicle.driverStatus === "present"
                            ? "حاضر"
                            : "غائب"
                    }

                </div>


                <div class="notes-cell">

                    ${
                        vehicle.notes
                            ? `
                                <span
                                    class="notes-icon"
                                    title="${escapeHtml(
                                        vehicle.notes
                                    )}"
                                >
                                    ✉
                                </span>
                              `
                            : "—"
                    }

                </div>


                <div>
                    ${formatAge(
                        vehicle.updatedAt
                    )}
                </div>

            `;


            grid.appendChild(row);

        }
    );

}


/* =========================================================
   ROW COLOR
========================================================= */

function getRowClass(vehicle) {

    /*
       إذا لم يتم تحديث المركبة
       أو مر أكثر من 24 ساعة:
       رمادي.
    */

    if (
        isStale(
            vehicle.updatedAt
        )
    ) {

        return "vehicle-old";

    }


    if (
        vehicle.vehicleStatus === "working" &&
        vehicle.driverStatus === "present"
    ) {

        return "status-working";

    }


    if (
        vehicle.vehicleStatus === "stopped"
    ) {

        return "status-stopped";

    }


    return "maintenance-routine";

}


/* =========================================================
   UPDATE CONFIRMATION
========================================================= */

function askUpdate(vehicle) {

    selectedVehicle =
        vehicle;


    const number =
        vehicle.number ||
        vehicle.serial;


    const confirmText =
        $("confirmText");


    if (confirmText) {

        confirmText.textContent =
            `هل ترغب في تحديث حالة المركبة رقم (${number})؟`;

    }


    const modal =
        $("confirmModal");


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


/* =========================================================
   CONFIRM UPDATE
========================================================= */

function confirmUpdate() {

    closeConfirmModal();

    openDetails();

}


/* =========================================================
   OPEN DETAILS
========================================================= */

function openDetails() {

    if (!selectedVehicle) {
        return;
    }


    const title =
        $("modalTitle");


    if (title) {

        title.textContent =
            `بيانات المركبة ${
                selectedVehicle.number ||
                selectedVehicle.serial
            }`;

    }


    renderPreview();


    const editArea =
        $("editArea");


    if (editArea) {

        editArea.classList.add(
            "hidden"
        );

    }


    const modal =
        $("detailsModal");


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


/* =========================================================
   PREVIEW
========================================================= */

function renderPreview() {

    if (!selectedVehicle) {
        return;
    }


    const box =
        $("vehiclePreview");


    if (!box) {
        return;
    }


    const v =
        selectedVehicle;


    box.innerHTML = `

        <div class="preview-row">
            <span class="preview-label">
                الرقم التسلسلي
            </span>
            <span>
                ${escapeHtml(v.serial)}
            </span>
        </div>


        <div class="preview-row">
            <span class="preview-label">
                رقم المركبة
            </span>
            <span>
                ${escapeHtml(v.number || "—")}
            </span>
        </div>


        <div class="preview-row">
            <span class="preview-label">
                نوع المركبة
            </span>
            <span>
                ${escapeHtml(v.type || "—")}
            </span>
        </div>


        <div class="preview-row">
            <span class="preview-label">
                المفوض / السائق
            </span>
            <span>
                ${escapeHtml(v.driver || "—")}
            </span>
        </div>


        <div class="preview-row">
            <span class="preview-label">
                حالة المركبة
            </span>
            <span>
                ${
                    v.vehicleStatus === "working"
                        ? "تعمل"
                        : "لا تعمل"
                }
            </span>
        </div>


        <div class="preview-row">
            <span class="preview-label">
                حالة السائق
            </span>
            <span>
                ${
                    v.driverStatus === "present"
                        ? "حاضر"
                        : "غائب"
                }
            </span>
        </div>


        <div class="preview-row">
            <span class="preview-label">
                حالة الصيانة
            </span>
            <span>
                ${maintenanceText(
                    v.maintenance
                )}
            </span>
        </div>


        <div class="preview-row">
            <span class="preview-label">
                الملاحظات
            </span>
            <span>
                ${escapeHtml(
                    v.notes || "لايوجد"
                )}
            </span>
        </div>


        <div class="preview-row">
            <span class="preview-label">
                آخر تحديث
            </span>
            <span>
                ${escapeHtml(
                    v.updatedAt || "—"
                )}
            </span>
        </div>

    `;

}


/* =========================================================
   REQUEST EDIT
========================================================= */

function requestEdit() {

    if (!selectedVehicle) {
        return;
    }


    const vehiclePassword =
        $("vehiclePassword");


    if (vehiclePassword) {

        vehiclePassword.value =
            selectedVehicle.number ||
            selectedVehicle.serial;

    }


    const supervisorPassword =
        $("supervisorPassword");


    if (supervisorPassword) {

        supervisorPassword.value =
            "";

    }


    const message =
        $("passwordMessage");


    if (message) {

        message.textContent =
            "";

    }


    const modal =
        $("passwordModal");


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    setTimeout(
        () => {

            if ($("supervisorPassword")) {

                $("supervisorPassword")
                    .focus();

            }

        },
        100
    );

}


/* =========================================================
   VERIFY EDIT PASSWORD
========================================================= */

function verifyEdit() {

    if (!selectedVehicle) {
        return;
    }


    const input =
        $("supervisorPassword");


    if (!input) {
        return;
    }


    const password =
        input.value.trim();


    const message =
        $("passwordMessage");


    if (!password) {

        if (message) {

            message.textContent =
                "أدخل الرقم السري.";

        }

        return;
    }


    /*
       المشرف
    */

    if (
        password ===
        SUPERVISOR_PASSWORD
    ) {

        closePasswordModal();

        populateEditForm(
            true
        );

        return;
    }


    /*
       المفوض
    */

    if (
        selectedVehicle.password &&
        password ===
        String(
            selectedVehicle.password
        ).trim()
    ) {

        closePasswordModal();

        populateEditForm(
            false
        );

        return;
    }


    if (message) {

        message.textContent =
            "الرقم السري غير صحيح.";

    }

}


/* =========================================================
   POPULATE EDIT FORM
========================================================= */

function populateEditForm(
    isSupervisor
) {

    const v =
        selectedVehicle;


    if (!v) {
        return;
    }


    if ($("editNumber")) {

        $("editNumber").value =
            v.number || "";

    }


    if ($("editDriver")) {

        $("editDriver").value =
            v.driver || "";

    }


    if ($("editVehicleStatus")) {

        $("editVehicleStatus").value =
            v.vehicleStatus;

    }


    if ($("editDriverStatus")) {

        $("editDriverStatus").value =
            v.driverStatus;

    }


    if ($("editMaintenance")) {

        $("editMaintenance").value =
            v.maintenance || "none";

    }


    if ($("editNotes")) {

        $("editNotes").value =
            v.notes || "";

    }


    if ($("editNumber")) {

        $("editNumber").readOnly =
            !isSupervisor;

    }


    if ($("editDriver")) {

        $("editDriver").readOnly =
            !isSupervisor;

    }


    if ($("saveMessage")) {

        $("saveMessage").textContent =
            isSupervisor
                ? "صلاحية المشرف مفعلة."
                : "صلاحية المفوض مفعلة.";

    }


    if ($("editArea")) {

        $("editArea")
            .classList
            .remove("hidden");

    }

}


/* =========================================================
   SAVE VEHICLE
========================================================= */

async function saveVehicle() {

    if (!selectedVehicle) {
        return;
    }


    const number =
        $("editNumber")
            ?.value
            .trim() || "";


    const driver =
        $("editDriver")
            ?.value
            .trim() || "";


    const vehicleStatus =
        $("editVehicleStatus")
            ?.value || "working";


    const driverStatus =
        $("editDriverStatus")
            ?.value || "absent";


    const maintenance =
        $("editMaintenance")
            ?.value || "none";


    const notes =
        $("editNotes")
            ?.value
            .trim() || "";


    if (!number) {

        if ($("saveMessage")) {

            $("saveMessage").textContent =
                "رقم المركبة مطلوب.";

        }

        return;
    }


    const payload = {

        action:
            "updateVehicle",

        /*
           مهم:
           يتم إرسال ID والـ Serial معًا.
           Code.gs سيبحث بالـ ID أولًا.
        */

        id:
            selectedVehicle.id,

        serial:
            selectedVehicle.serial,

        number:
            number,

        driver:
            driver,

        vehicleStatus:
            vehicleStatus,

        driverStatus:
            driverStatus,

        maintenance:
            maintenance,

        notes:
            notes,

        /*
           الوقت الفعلي يسجل من الخادم.
        */

        updatedAt:
            new Date().toISOString()

    };


    if ($("saveMessage")) {

        $("saveMessage").textContent =
            "جاري حفظ التعديل...";

    }


    try {

        const result =
            await apiPost(
                payload
            );


        if (
            !result ||
            !result.ok
        ) {

            throw new Error(
                result?.message ||
                "فشل الحفظ"
            );

        }


        /*
           تحديث الكائن المحلي
        */

        Object.assign(
            selectedVehicle,
            {
                number:
                    result.vehicle?.number ??
                    number,

                driver:
                    result.vehicle?.driver ??
                    driver,

                vehicleStatus:
                    normalizeVehicleStatus(
                        result.vehicle?.vehicleStatus ??
                        vehicleStatus
                    ),

                driverStatus:
                    normalizeDriverStatus(
                        result.vehicle?.driverStatus ??
                        driverStatus
                    ),

                maintenance:
                    normalizeMaintenance(
                        result.vehicle?.maintenance ??
                        maintenance
                    ),

                notes:
                    result.vehicle?.notes ??
                    notes,

                updatedAt:
                    result.vehicle?.updatedAt ??
                    new Date().toISOString()

            }
        );


        if ($("saveMessage")) {

            $("saveMessage").textContent =
                "تم حفظ التعديل بنجاح.";

        }


        renderPreview();

        renderVehicles();


        /*
           إعادة تحميل من Google Sheets
           للتأكد من تطابق البيانات.
        */

        setTimeout(
            loadVehicles,
            500
        );

    }

    catch (error) {

        console.error(
            "saveVehicle:",
            error
        );


        if ($("saveMessage")) {

            $("saveMessage").textContent =
                "تعذر حفظ التعديل. تحقق من الاتصال.";

        }

    }

}


/* =========================================================
   ADMIN PASSWORD
========================================================= */

function requestAdminAction(
    action
) {

    pendingAdminAction =
        action;


    if ($("adminPasswordInput")) {

        $("adminPasswordInput")
            .value = "";

    }


    if ($("adminPasswordMessage")) {

        $("adminPasswordMessage")
            .textContent = "";

    }


    const modal =
        $("adminPasswordModal");


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    setTimeout(
        () => {

            if ($("adminPasswordInput")) {

                $("adminPasswordInput")
                    .focus();

            }

        },
        100
    );

}


/* =========================================================
   VERIFY ADMIN
========================================================= */

function verifyAdminPassword() {

    const input =
        $("adminPasswordInput");


    if (!input) {
        return;
    }


    const password =
        input.value.trim();


    if (
        password !==
        SUPERVISOR_PASSWORD
    ) {

        if ($("adminPasswordMessage")) {

            $("adminPasswordMessage")
                .textContent =
                    "الرقم السري للمشرف غير صحيح.";

        }

        return;
    }


    const action =
        pendingAdminAction;


    pendingAdminAction =
        null;


    closeAdminPasswordModal();


    if (
        action ===
        "add"
    ) {

        openAddVehicle();

    }


    if (
        action ===
        "delete"
    ) {

        deleteVehicle();

    }

}


/* =========================================================
   ADD VEHICLE
========================================================= */

function openAddVehicle() {

    if ($("newVehicleNumber")) {

        $("newVehicleNumber")
            .value = "";

    }


    if ($("newVehicleDriver")) {

        $("newVehicleDriver")
            .value = "";

    }


    if ($("addVehicleMessage")) {

        $("addVehicleMessage")
            .textContent = "";

    }


    const modal =
        $("addVehicleModal");


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    setTimeout(
        () => {

            if ($("newVehicleNumber")) {

                $("newVehicleNumber")
                    .focus();

            }

        },
        100
    );

}


/* =========================================================
   SAVE NEW VEHICLE
========================================================= */

async function saveNewVehicle() {

    const number =
        $("newVehicleNumber")
            ?.value
            .trim() || "";


    const driver =
        $("newVehicleDriver")
            ?.value
            .trim() || "";


    if (!number) {

        if ($("addVehicleMessage")) {

            $("addVehicleMessage")
                .textContent =
                    "أدخل رقم المركبة.";

        }

        return;
    }


    if (
        vehicles.some(
            v =>
                String(
                    v.number
                )
                .trim()
                .toLowerCase() ===
                number
                    .trim()
                    .toLowerCase()
        )
    ) {

        if ($("addVehicleMessage")) {

            $("addVehicleMessage")
                .textContent =
                    "رقم المركبة موجود بالفعل.";

        }

        return;
    }


    if ($("addVehicleMessage")) {

        $("addVehicleMessage")
            .textContent =
                "جاري إضافة المركبة...";

    }


    const payload = {

        action:
            "addVehicle",

        number:
            number,

        driver:
            driver,

        vehicleStatus:
            "working",

        driverStatus:
            "absent",

        maintenance:
            "none",

        notes:
            "",

        updatedAt:
            ""

    };


    try {

        const result =
            await apiPost(
                payload
            );


        if (
            !result ||
            !result.ok
        ) {

            throw new Error(
                result?.message ||
                "فشل إضافة المركبة"
            );

        }


        /*
           إعادة القراءة من Google Sheets
           هي الطريقة الأدق لضمان تطابق
           Serial / ID / Update Time.
        */

        await loadVehicles();


        if ($("addVehicleMessage")) {

            $("addVehicleMessage")
                .textContent =
                    "تمت إضافة المركبة بنجاح.";

        }


        setTimeout(
            closeAddVehicleModal,
            700
        );

    }

    catch (error) {

        console.error(
            "saveNewVehicle:",
            error
        );


        if ($("addVehicleMessage")) {

            $("addVehicleMessage")
                .textContent =
                    error.message ||
                    "تعذر إضافة المركبة.";

        }

    }

}


/* =========================================================
   DELETE VEHICLE
========================================================= */

function requestDeleteVehicle() {

    if (!selectedVehicle) {

        alert(
            "حدد المركبة أولاً."
        );

        return;
    }


    requestAdminAction(
        "delete"
    );

}


/* =========================================================
   DELETE AFTER PASSWORD
========================================================= */

async function deleteVehicle() {

    if (!selectedVehicle) {
        return;
    }


    const vehicle =
        selectedVehicle;


    const number =
        vehicle.number ||
        vehicle.serial;


    const confirmed =
        window.confirm(
            `هل أنت متأكد من حذف المركبة رقم (${number})؟`
        );


    if (!confirmed) {
        return;
    }


    try {

        const result =
            await apiPost({

                action:
                    "deleteVehicle",

                id:
                    vehicle.id,

                serial:
                    vehicle.serial,

                number:
                    vehicle.number

            });


        if (
            !result ||
            !result.ok
        ) {

            throw new Error(
                result?.message ||
                "فشل حذف المركبة"
            );

        }


        vehicles =
            vehicles.filter(
                v =>
                    String(v.id) !==
                    String(vehicle.id)
            );


        selectedVehicle =
            null;


        renderVehicles();

        closeModal();


    }

    catch (error) {

        console.error(
            "deleteVehicle:",
            error
        );


        alert(
            error.message ||
            "تعذر حذف المركبة. تحقق من الاتصال."
        );

    }

}


/* =========================================================
   GENERIC API POST
========================================================= */

async function apiPost(
    payload
) {

    const response =
        await fetch(
            API_URL,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body:
                    JSON.stringify(
                        payload
                    )
            }
        );


    if (!response.ok) {

        throw new Error(
            "HTTP " +
            response.status
        );

    }


    const text =
        await response.text();


    if (!text) {

        throw new Error(
            "الخادم لم يرجع بيانات."
        );

    }


    try {

        return JSON.parse(
            text
        );

    }

    catch {

        throw new Error(
            "استجابة الخادم غير صحيحة."
        );

    }

}


/* =========================================================
   CLOSE DETAILS
========================================================= */

function closeModal() {

    const modal =
        $("detailsModal");


    if (!modal) {
        return;
    }


    modal.classList.add(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   CLOSE PASSWORD
========================================================= */

function closePasswordModal() {

    const modal =
        $("passwordModal");


    if (!modal) {
        return;
    }


    modal.classList.add(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   CLOSE CONFIRM
========================================================= */

function closeConfirmModal() {

    const modal =
        $("confirmModal");


    if (!modal) {
        return;
    }


    modal.classList.add(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   CLOSE ADMIN PASSWORD
========================================================= */

function closeAdminPasswordModal() {

    const modal =
        $("adminPasswordModal");


    if (!modal) {
        return;
    }


    modal.classList.add(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   CLOSE ADD
========================================================= */

function closeAddVehicleModal() {

    const modal =
        $("addVehicleModal");


    if (!modal) {
        return;
    }


    modal.classList.add(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   ADMIN PANEL
========================================================= */

function openAdminPanel() {

    const modal =
        $("adminModal");


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeAdminModal() {

    const modal =
        $("adminModal");


    if (!modal) {
        return;
    }


    modal.classList.add(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   ADMIN BUTTONS
========================================================= */

function adminAddVehicle() {

    requestAdminAction(
        "add"
    );

}


function adminDeleteVehicle() {

    requestAdminAction(
        "delete"
    );

}


/* =========================================================
   MAINTENANCE
========================================================= */

function maintenanceText(
    value
) {

    return {

        none:
            "لايوجد",

        routine:
            "صيانة دورية",

        emergency:
            "صيانة طارئة"

    }[
        value
    ] ||
    value ||
    "لايوجد";

}


/* =========================================================
   DATE PARSER
========================================================= */

function parseDate(
    value
) {

    if (
        value instanceof Date
    ) {

        return value;

    }


    const s =
        String(value ?? "")
            .trim();


    if (!s) {
        return null;
    }


    let d =
        new Date(s);


    if (
        !Number.isNaN(
            d.getTime()
        )
    ) {

        return d;

    }


    const m =
        s.match(
            /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
        );


    if (m) {

        const candidate =
            new Date(
                Number(m[3]),
                Number(m[2]) - 1,
                Number(m[1]),
                Number(m[4] || 0),
                Number(m[5] || 0),
                Number(m[6] || 0)
            );


        return Number.isNaN(
            candidate.getTime()
        )
            ? null
            : candidate;

    }


    return null;

}


/* =========================================================
   24 HOURS
========================================================= */

function isStale(
    value
) {

    const date =
        parseDate(value);


    if (!date) {
        return true;
    }


    const age =
        Date.now() -
        date.getTime();


    return age >
        24 *
        60 *
        60 *
        1000;

}


/* =========================================================
   FORMAT AGE
========================================================= */

function formatAge(
    value
) {

    const d =
        parseDate(value);


    if (!d) {
        return "—";
    }


    const diff =
        Math.max(
            0,
            Date.now() -
            d.getTime()
        );


    const days =
        Math.floor(
            diff /
            86400000
        );


    const hours =
        Math.floor(
            diff /
            3600000
        );


    const minutes =
        Math.floor(
            diff /
            60000
        );


    if (days >= 1) {

        return `${days} D`;

    }


    if (hours >= 1) {

        return `${hours} H`;

    }


    if (minutes >= 1) {

        return `${minutes} M`;

    }


    return "0 M";

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   AUTO REFRESH
========================================================= */

setInterval(
    () => {

        if (
            !document.hidden
        ) {

            loadVehicles();

        }

    },
    30000
);
