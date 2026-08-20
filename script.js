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
    "https://script.google.com/macros/s/AKfycby6VW6zVXt8D1dmqFvwzN1YGR9I2ZX--Bn_iyP04FBGj2wR5kJUUMQmu_QpH4_3aNH/exec";


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

const $ = id => document.getElementById(id);


/* =========================================================
   PAGE START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateClock();

        setInterval(updateClock, 1000);

        loadVehicles();


        $("editBtn").addEventListener(
            "click",
            requestEdit
        );


        $("verifyBtn").addEventListener(
            "click",
            verifyEdit
        );


        $("saveBtn").addEventListener(
            "click",
            saveVehicle
        );


        $("confirmYesBtn").addEventListener(
            "click",
            confirmUpdate
        );


        $("confirmNoBtn").addEventListener(
            "click",
            closeConfirmModal
        );


        $("verifyAdminPasswordBtn").addEventListener(
            "click",
            verifyAdminPassword
        );


        $("addVehicleBtn").addEventListener(
            "click",
            openAddVehicle
        );


        $("deleteVehicleBtn").addEventListener(
            "click",
            requestDeleteVehicle
        );


        $("saveNewVehicleBtn").addEventListener(
            "click",
            saveNewVehicle
        );


        $("supervisorPassword").addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {
                    verifyEdit();
                }

            }
        );


        $("adminPasswordInput").addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {
                    verifyAdminPassword();
                }

            }
        );

    }
);


/* =========================================================
   DATE / TIME
========================================================= */

function updateClock() {

    const now = new Date();

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

    $("dateTime").textContent =
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
                `${API_URL}?action=getVehicles`,
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


        const data =
            await response.json();


        vehicles =
            Array.isArray(data)
                ? data
                : (data.vehicles || []);


        vehicles =
            normalizeVehicles(vehicles);


        renderVehicles();

    }

    catch (error) {

        console.error(error);

        $("vehicleGrid").innerHTML =
            `
            <div class="loading">
                تعذر تحميل بيانات المركبات.
                تحقق من الاتصال بالخادم.
            </div>
            `;

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
                    i + 1,

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
                    v.maintenance ??
                    v.maintenanceStatus ??
                    "none",

                notes:
                    v.notes ??
                    "",

                updatedAt:
                    v.updatedAt ??
                    v.updated ??
                    v.time ??
                    "",

                /*
                   الرقم السري الخاص بالمفوض
                   يمكن أن يأتي من Google Sheets
                   باسم password أو vehiclePassword
                */
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


/* =========================================================
   DEMO DATA
========================================================= */

function createDemoVehicles() {

    const result = [];

    for (let i = 1; i <= 68; i++) {

        result.push({

            id: i,

            serial: i,

            number:
                String(i).padStart(3, "0"),

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
        (vehicle, index) => {

            const row =
                document.createElement("div");


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
                    ${escapeHtml(vehicle.serial)}
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
                            ? `<span class="notes-icon"
                                    title="${escapeHtml(vehicle.notes)}">
                                    ✉
                               </span>`
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


    $("confirmText").textContent =
        `هل ترغب في تحديث حالة المركبة رقم (${number})؟`;


    $("confirmModal")
        .classList
        .remove("hidden");


    $("confirmModal")
        .setAttribute(
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


    $("modalTitle").textContent =
        `بيانات المركبة ${
            selectedVehicle.number ||
            selectedVehicle.serial
        }`;


    renderPreview();


    $("editArea")
        .classList
        .add("hidden");


    $("detailsModal")
        .classList
        .remove("hidden");


    $("detailsModal")
        .setAttribute(
            "aria-hidden",
            "false"
        );

}


/* =========================================================
   PREVIEW
========================================================= */

function renderPreview() {

    const v =
        selectedVehicle;


    $("vehiclePreview").innerHTML = `

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
                ${maintenanceText(v.maintenance)}
            </span>
        </div>


        <div class="preview-row">
            <span class="preview-label">
                الملاحظات
            </span>
            <span>
                ${escapeHtml(v.notes || "لايوجد")}
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


    $("vehiclePassword").value =
        selectedVehicle.number ||
        selectedVehicle.serial;


    $("supervisorPassword").value =
        "";


    $("passwordMessage").textContent =
        "";


    $("passwordModal")
        .classList
        .remove("hidden");


    $("passwordModal")
        .setAttribute(
            "aria-hidden",
            "false"
        );


    setTimeout(
        () => {

            $("supervisorPassword")
                .focus();

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


    const password =
        $("supervisorPassword")
            .value
            .trim();


    if (!password) {

        $("passwordMessage").textContent =
            "أدخل الرقم السري.";

        return;
    }


    /*
       المشرف يستطيع تعديل جميع البيانات
    */

    if (
        password ===
        SUPERVISOR_PASSWORD
    ) {

        closePasswordModal();

        populateEditForm(true);

        return;
    }


    /*
       الرقم السري الخاص بالمركبة
    */

    if (
        selectedVehicle.password &&
        password ===
        String(
            selectedVehicle.password
        ).trim()
    ) {

        closePasswordModal();

        populateEditForm(false);

        return;
    }


    $("passwordMessage").textContent =
        "الرقم السري غير صحيح.";

}


/* =========================================================
   POPULATE EDIT FORM
========================================================= */

function populateEditForm(isSupervisor) {

    const v =
        selectedVehicle;


    $("editNumber").value =
        v.number || "";


    $("editDriver").value =
        v.driver || "";


    $("editVehicleStatus").value =
        v.vehicleStatus;


    $("editDriverStatus").value =
        v.driverStatus;


    $("editMaintenance").value =
        v.maintenance || "none";


    $("editNotes").value =
        v.notes || "";


    /*
       المفوض:
       لا يستطيع تعديل الرقم أو المفوض.
       المشرف:
       يستطيع تعديلهما.
    */

    $("editNumber").readOnly =
        !isSupervisor;


    $("editDriver").readOnly =
        !isSupervisor;


    $("saveMessage").textContent =
        isSupervisor
            ? "صلاحية المشرف مفعلة."
            : "صلاحية المفوض مفعلة.";


    $("editArea")
        .classList
        .remove("hidden");

}


/* =========================================================
   SAVE VEHICLE
========================================================= */

async function saveVehicle() {

    if (!selectedVehicle) {
        return;
    }


    const payload = {

        action:
            "updateVehicle",

        id:
            selectedVehicle.id,

        serial:
            selectedVehicle.serial,

        number:
            $("editNumber")
                .value
                .trim(),

        driver:
            $("editDriver")
                .value
                .trim(),

        vehicleStatus:
            $("editVehicleStatus")
                .value,

        driverStatus:
            $("editDriverStatus")
                .value,

        maintenance:
            $("editMaintenance")
                .value,

        notes:
            $("editNotes")
                .value
                .trim(),

        updatedAt:
            new Date().toISOString()

    };


    $("saveMessage").textContent =
        "جاري حفظ التعديل...";


    try {

        const result =
            await apiPost(payload);


        if (!result.ok) {

            throw new Error(
                result.message ||
                "فشل الحفظ"
            );

        }


        Object.assign(
            selectedVehicle,
            payload
        );


        $("saveMessage").textContent =
            "تم حفظ التعديل بنجاح.";


        renderPreview();

        renderVehicles();


    }

    catch (error) {

        console.error(error);

        $("saveMessage").textContent =
            "تعذر حفظ التعديل. تحقق من الاتصال.";

    }

}


/* =========================================================
   ADMIN PASSWORD
========================================================= */

function requestAdminAction(action) {

    pendingAdminAction =
        action;


    $("adminPasswordInput").value =
        "";


    $("adminPasswordMessage").textContent =
        "";


    $("adminPasswordModal")
        .classList
        .remove("hidden");


    $("adminPasswordModal")
        .setAttribute(
            "aria-hidden",
            "false"
        );


    setTimeout(
        () => {

            $("adminPasswordInput")
                .focus();

        },
        100
    );

}


/* =========================================================
   VERIFY ADMIN
========================================================= */

function verifyAdminPassword() {

    const password =
        $("adminPasswordInput")
            .value
            .trim();


    if (
        password !==
        SUPERVISOR_PASSWORD
    ) {

        $("adminPasswordMessage").textContent =
            "الرقم السري للمشرف غير صحيح.";

        return;
    }


    const action =
        pendingAdminAction;


    pendingAdminAction =
        null;


    closeAdminPasswordModal();


    if (action === "add") {

        openAddVehicle();

    }


    if (action === "delete") {

        deleteVehicle();

    }

}


/* =========================================================
   ADD VEHICLE
========================================================= */

function openAddVehicle() {

    $("newVehicleNumber").value =
        "";


    $("newVehicleDriver").value =
        "";


    $("addVehicleMessage").textContent =
        "";


    $("addVehicleModal")
        .classList
        .remove("hidden");


    $("addVehicleModal")
        .setAttribute(
            "aria-hidden",
            "false"
        );


    setTimeout(
        () => {

            $("newVehicleNumber")
                .focus();

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
            .value
            .trim();


    const driver =
        $("newVehicleDriver")
            .value
            .trim();


    if (!number) {

        $("addVehicleMessage").textContent =
            "أدخل رقم المركبة.";

        return;
    }


    if (
        vehicles.some(
            v =>
                String(v.number).trim() ===
                number
        )
    ) {

        $("addVehicleMessage").textContent =
            "رقم المركبة موجود بالفعل.";

        return;
    }


    $("addVehicleMessage").textContent =
        "جاري إضافة المركبة...";


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
            await apiPost(payload);


        if (!result.ok) {

            throw new Error(
                result.message ||
                "فشل إضافة المركبة"
            );

        }


        const newVehicle =
            normalizeVehicles(
                [
                    result.vehicle ||
                    payload
                ]
            )[0];


        newVehicle.id =
            result.id ??
            newVehicle.id ??
            Date.now();


        newVehicle.serial =
            result.serial ??
            (
                Math.max(
                    0,
                    ...vehicles.map(
                        v =>
                            Number(v.serial) || 0
                    )
                ) + 1
            );


        vehicles.push(
            newVehicle
        );


        renderVehicles();


        $("addVehicleMessage").textContent =
            "تمت إضافة المركبة بنجاح.";


        setTimeout(
            closeAddVehicleModal,
            700
        );

    }

    catch (error) {

        console.error(error);

        $("addVehicleMessage").textContent =
            "تعذر إضافة المركبة.";

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


    const number =
        selectedVehicle.number ||
        selectedVehicle.serial;


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
                    selectedVehicle.id,

                serial:
                    selectedVehicle.serial,

                number:
                    selectedVehicle.number

            });


        if (!result.ok) {

            throw new Error(
                result.message ||
                "فشل حذف المركبة"
            );

        }


        vehicles =
            vehicles.filter(
                v =>
                    String(v.id) !==
                    String(
                        selectedVehicle.id
                    )
            );


        selectedVehicle =
            null;


        renderVehicles();


        closeModal();

    }

    catch (error) {

        console.error(error);

        alert(
            "تعذر حذف المركبة. تحقق من الاتصال."
        );

    }

}


/* =========================================================
   GENERIC API POST
========================================================= */

async function apiPost(payload) {

    const response =
        await fetch(
            API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body:
                    JSON.stringify(payload)
            }
        );


    if (!response.ok) {

        throw new Error(
            "HTTP " +
            response.status
        );

    }


    return await response.json();

}


/* =========================================================
   CLOSE DETAILS
========================================================= */

function closeModal() {

    $("detailsModal")
        .classList
        .add("hidden");


    $("detailsModal")
        .setAttribute(
            "aria-hidden",
            "true"
        );

}


/* =========================================================
   CLOSE PASSWORD
========================================================= */

function closePasswordModal() {

    $("passwordModal")
        .classList
        .add("hidden");


    $("passwordModal")
        .setAttribute(
            "aria-hidden",
            "true"
        );

}


/* =========================================================
   CLOSE CONFIRM
========================================================= */

function closeConfirmModal() {

    $("confirmModal")
        .classList
        .add("hidden");


    $("confirmModal")
        .setAttribute(
            "aria-hidden",
            "true"
        );

}


/* =========================================================
   CLOSE ADMIN PASSWORD
========================================================= */

function closeAdminPasswordModal() {

    $("adminPasswordModal")
        .classList
        .add("hidden");


    $("adminPasswordModal")
        .setAttribute(
            "aria-hidden",
            "true"
        );

}


/* =========================================================
   CLOSE ADD
========================================================= */

function closeAddVehicleModal() {

    $("addVehicleModal")
        .classList
        .add("hidden");


    $("addVehicleModal")
        .setAttribute(
            "aria-hidden",
            "true"
        );

}


/* =========================================================
   ADMIN BUTTONS
   يمكن استدعاؤها من واجهة المشرف
========================================================= */

function openAdminPanel() {

    $("adminModal")
        .classList
        .remove("hidden");


    $("adminModal")
        .setAttribute(
            "aria-hidden",
            "false"
        );

}


function closeAdminModal() {

    $("adminModal")
        .classList
        .add("hidden");


    $("adminModal")
        .setAttribute(
            "aria-hidden",
            "true"
        );

}


/*
   إضافة مركبة للمشرف
*/

function adminAddVehicle() {

    requestAdminAction(
        "add"
    );

}


/*
   حذف مركبة للمشرف
*/

function adminDeleteVehicle() {

    requestAdminAction(
        "delete"
    );

}


/* =========================================================
   MAINTENANCE
========================================================= */

function maintenanceText(value) {

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

function parseDate(value) {

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

        return new Date(

            Number(m[3]),

            Number(m[2]) - 1,

            Number(m[1]),

            Number(m[4] || 0),

            Number(m[5] || 0),

            Number(m[6] || 0)

        );

    }


    return null;

}


/* =========================================================
   24 HOURS
========================================================= */

function isStale(value) {

    const date =
        parseDate(value);


    if (!date) {
        return true;
    }


    return (
        Date.now() -
        date.getTime()
    ) >
    24 * 60 * 60 * 1000;

}


/* =========================================================
   FORMAT AGE
========================================================= */

function formatAge(value) {

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

function escapeHtml(value) {

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

        /*
           إعادة قراءة البيانات كل 30 ثانية
           مع الحفاظ على النافذة المفتوحة.
        */

        loadVehicles();

    },
    30000
);
