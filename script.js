/* =========================================================
   ATP VEHICLE STATUS
   SCRIPT.JS
   Google Apps Script + Google Sheets
========================================================= */

"use strict";


/* =========================================================
   SETTINGS
========================================================= */

/*
   ضع هنا رابط Google Apps Script Web App
   بعد نشر Code.gs

   مثال:
   https://script.google.com/macros/s/XXXXXXXXXXXX/exec
*/

const API_URL = "https://script.google.com/macros/s/AKfycby6VW6zVXt8D1dmqFvwzN1YGR9I2ZX--Bn_iyP04FBgGj2wR5kJUUMQmu_QpH4_3aNH/exec";


/*
   الرقم السري الثاني الخاص بالمشرف
*/

const SUPERVISOR_PASSWORD = "12345";


/*
   عدد المركبات والمعدات
*/

const MAX_VEHICLES = 100;



/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let vehicles = [];

let selectedVehicle = null;



/* =========================================================
   SHORT SELECTOR
========================================================= */

const $ = (id) => document.getElementById(id);



/* =========================================================
   PAGE START
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

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

});



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


    const day = days[now.getDay()];


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

        /*
           إذا لم يتم وضع رابط Google Apps Script
           سيتم تشغيل الصفحة في وضع تجريبي.
        */

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
            normalizeVehicles(
                vehicles
            );


        ensure100Vehicles();


        renderVehicles();


    } catch (error) {

        console.error(error);


        $("vehicleGrid").innerHTML =

            `<div class="loading">
                تعذر تحميل البيانات.
                تحقق من رابط Google Apps Script.
            </div>`;

    }

}



/* =========================================================
   NORMALIZE VEHICLES
========================================================= */

function normalizeVehicles(list) {

    return list.map((v, i) => {

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


            vehicleStatus:
                normalizeVehicleStatus(
                    v.vehicleStatus ??
                    v.status ??
                    v.VC
                ),


            driver:
                v.driver ??
                v.driverName ??
                v.DN ??
                "",


            driverStatus:
                normalizeDriverStatus(
                    v.driverStatus ??
                    v.DC
                ),


            maintenance:
                v.maintenance ??
                "none",


            notes:
                v.notes ??
                "",


            updatedAt:
                v.updatedAt ??
                v.updated ??
                v.time ??
                ""

        };

    });

}



/* =========================================================
   VEHICLE STATUS
========================================================= */

function normalizeVehicleStatus(value) {

    const s =
        String(
            value ?? ""
        )
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


    if (
        [
            "stopped",
            "لا تعمل",
            "متوقفة",
            "متوقف",
            "0",
            "false"
        ].includes(s)
    ) {

        return "stopped";

    }


    return "working";

}



/* =========================================================
   DRIVER STATUS
========================================================= */

function normalizeDriverStatus(value) {

    const s =
        String(
            value ?? ""
        )
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


    if (
        [
            "absent",
            "غائب",
            "0",
            "false"
        ].includes(s)
    ) {

        return "absent";

    }


    return "absent";

}



/* =========================================================
   ENSURE 100 VEHICLES
========================================================= */

function ensure100Vehicles() {

    while (
        vehicles.length < MAX_VEHICLES
    ) {

        const n =
            vehicles.length + 1;


        vehicles.push({

            id: n,

            serial: n,

            number: "",

            vehicleStatus:
                "working",

            driver: "",

            driverStatus:
                "absent",

            maintenance:
                "none",

            notes: "",

            updatedAt: ""

        });

    }


    vehicles =
        vehicles.slice(
            0,
            MAX_VEHICLES
        );

}



/* =========================================================
   DEMO VEHICLES
========================================================= */

function createDemoVehicles() {

    const arr = [];


    for (
        let i = 1;
        i <= MAX_VEHICLES;
        i++
    ) {

        arr.push({

            id: i,

            serial: i,

            number:
                String(i)
                .padStart(3, "0"),

            vehicleStatus:
                "working",

            driver: "",

            driverStatus:
                "absent",

            maintenance:
                "none",

            notes: "",

            updatedAt: ""

        });

    }


    return arr;

}



/* =========================================================
   RENDER VEHICLES
========================================================= */

function renderVehicles() {

    const grid =
        $("vehicleGrid");


    grid.innerHTML = "";


    vehicles.forEach(
        (vehicle, index) => {

            const card =
                document.createElement(
                    "button"
                );


            card.type = "button";


            card.className =
                `vehicle-card ${getCardClass(vehicle)}`;


            card.title =
                `عرض بيانات المركبة ${
                    vehicle.number ||
                    vehicle.serial
                }`;


            card.addEventListener(
                "click",
                () => openDetails(index)
            );


            card.innerHTML = `

                <div>
                    ${escapeHtml(vehicle.serial)}
                </div>

                <div>
                    ${escapeHtml(
                        vehicle.number || "—"
                    )}
                </div>

                <div class="status-text">
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

                <div>
                    ${
                        vehicle.driverStatus === "present"
                            ? "حاضر"
                            : "غائب"
                    }
                </div>

                <div class="note-icon">
                    ${
                        vehicle.notes
                            ? "✉️"
                            : "—"
                    }
                </div>

                <div class="time-text">
                    ${formatAge(
                        vehicle.updatedAt
                    )}
                </div>

            `;


            grid.appendChild(card);

        }
    );

}



/* =========================================================
   CARD COLOR
========================================================= */

function getCardClass(vehicle) {

    /*
       أكثر من 24 ساعة =
       رمادي دائمًا مهما كانت الحالة.
    */

    if (
        isStale(
            vehicle.updatedAt
        )
    ) {

        return "status-stale";

    }


    /*
       مركبة تعمل + سائق حاضر
    */

    if (
        vehicle.vehicleStatus === "working" &&
        vehicle.driverStatus === "present"
    ) {

        return "status-working";

    }


    /*
       مركبة لا تعمل + سائق حاضر
    */

    if (
        vehicle.vehicleStatus === "stopped" &&
        vehicle.driverStatus === "present"
    ) {

        return "status-stopped";

    }


    /*
       مركبة تعمل + سائق غائب
    */

    if (
        vehicle.vehicleStatus === "working" &&
        vehicle.driverStatus === "absent"
    ) {

        return "status-absent";

    }


    /*
       مركبة لا تعمل + سائق غائب
    */

    return "status-stopped";

}



/* =========================================================
   CHECK 24 HOURS
========================================================= */

function isStale(value) {

    if (!value) {

        return true;

    }


    const date =
        parseDate(value);


    if (!date) {

        return true;

    }


    const elapsed =
        Date.now() -
        date.getTime();


    return (
        elapsed >
        24 * 60 * 60 * 1000
    );

}



/* =========================================================
   PARSE DATE
========================================================= */

function parseDate(value) {

    if (
        value instanceof Date
    ) {

        return value;

    }


    const s =
        String(value).trim();


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


    /*
       دعم:
       dd/MM/yyyy HH:mm:ss
    */

    const m =
        s.match(
            /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
        );


    if (m) {

        d =
            new Date(

                Number(m[3]),

                Number(m[2]) - 1,

                Number(m[1]),

                Number(m[4] || 0),

                Number(m[5] || 0),

                Number(m[6] || 0)

            );


        return d;

    }


    return null;

}



/* =========================================================
   FORMAT UPDATE AGE
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


    const minutes =
        Math.floor(
            diff / 60000
        );


    const hours =
        Math.floor(
            diff / 3600000
        );


    const days =
        Math.floor(
            diff / 86400000
        );


    if (days >= 1) {

        return `${days}D`;

    }


    if (hours >= 1) {

        return `${hours}H`;

    }


    if (minutes >= 1) {

        return `${minutes}M`;

    }


    return "0M";

}



/* =========================================================
   OPEN DETAILS
========================================================= */

function openDetails(index) {

    selectedVehicle =
        vehicles[index];


    $("modalTitle").textContent =

        `المركبة ${
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
   RENDER PREVIEW
========================================================= */

function renderPreview() {

    const v =
        selectedVehicle;


    $("vehiclePreview").innerHTML = `

        <div class="preview-row">

            <span class="preview-label">
                SN
            </span>

            <span>
                ${escapeHtml(v.serial)}
            </span>

        </div>


        <div class="preview-row">

            <span class="preview-label">
                VN
            </span>

            <span>
                ${escapeHtml(
                    v.number || "—"
                )}
            </span>

        </div>


        <div class="preview-row">

            <span class="preview-label">
                VC
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
                DN
            </span>

            <span>
                ${escapeHtml(
                    v.driver || "—"
                )}
            </span>

        </div>


        <div class="preview-row">

            <span class="preview-label">
                DC
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
                الصيانة
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
                    String(
                        v.updatedAt || "—"
                    )
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
        selectedVehicle.number || "";


    $("supervisorPassword").value =
        "";


    $("passwordMessage")
        .textContent = "";


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
        50
    );

}



/* =========================================================
   VERIFY PASSWORD
========================================================= */

function verifyEdit() {

    const number =
        $("vehiclePassword")
            .value
            .trim();


    const password =
        $("supervisorPassword")
            .value
            .trim();


    if (!selectedVehicle) {

        return;

    }


    /*
       التحقق من رقم المركبة
    */

    if (
        number !==
        String(
            selectedVehicle.number
        ).trim()
    ) {

        $("passwordMessage")
            .textContent =
            "رقم المركبة غير صحيح.";

        return;

    }


    /*
       التحقق من الرقم السري
    */

    if (
        password !==
        SUPERVISOR_PASSWORD
    ) {

        $("passwordMessage")
            .textContent =
            "الرقم السري غير صحيح.";

        return;

    }


    closePasswordModal();


    populateEditForm();


    $("editArea")
        .classList
        .remove("hidden");

}



/* =========================================================
   POPULATE EDIT FORM
========================================================= */

function populateEditForm() {

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
        v.maintenance ||
        "none";


    $("editNotes").value =
        v.notes || "";


    $("saveMessage")
        .textContent = "";

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
            new Date()
                .toISOString()

    };


    $("saveMessage")
        .textContent =
        "جاري الحفظ...";


    try {


        /*
           وضع تجريبي في حالة عدم وجود API
        */

        if (
            !API_URL ||
            API_URL.includes("ضع_رابط")
        ) {


            Object.assign(
                selectedVehicle,
                payload
            );


            vehicles[
                selectedVehicle.serial - 1
            ] =
                selectedVehicle;


            $("saveMessage")
                .textContent =
                "تم الحفظ محليًا في وضع التجربة.";


            renderPreview();


            renderVehicles();


            return;

        }



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


        const result =
            await response.json();


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


        $("saveMessage")
            .textContent =
            "تم حفظ التعديل بنجاح.";


        renderPreview();


        renderVehicles();


    } catch (error) {

        console.error(error);


        $("saveMessage")
            .textContent =
            "تعذر الحفظ. تحقق من الاتصال.";

    }

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
   MAINTENANCE TEXT
========================================================= */

function maintenanceText(value) {

    return {

        none:
            "لايوجد",

        routine:
            "صيانة دورية",

        emergency:
            "صيانة طارئة"

    }[value] || value || "لايوجد";

}



/* =========================================================
   HTML ESCAPE
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
