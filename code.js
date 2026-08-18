/*******************************************************
 * ATP VEHICLE STATUS
 * GOOGLE APPS SCRIPT BACKEND
 *
 * Google Sheet:
 * تسجيل حالة المركبات
 *
 * عدد البطاقات:
 * 100
 *******************************************************/


/* =====================================================
   SETTINGS
===================================================== */

const SHEET_NAME = "تسجيل حالة المركبات";

const MAX_VEHICLES = 100;

const SUPERVISOR_PASSWORD = "12345";


/* =====================================================
   SHEET HEADERS
===================================================== */

const HEADERS = [

    "SN",

    "VN",

    "VC",

    "DN",

    "DC",

    "Maintenance",

    "Notes",

    "Updated"

];



/* =====================================================
   GET REQUEST
===================================================== */

function doGet(e) {

    try {

        const action =
            e &&
            e.parameter &&
            e.parameter.action
                ? e.parameter.action
                : "getVehicles";


        /* ---------------------------------------------
           GET VEHICLES
        --------------------------------------------- */

        if (
            action === "getVehicles"
        ) {

            return jsonOutput({

                ok: true,

                vehicles:
                    getVehicles()

            });

        }


        return jsonOutput({

            ok: false,

            message:
                "Action غير معروف"

        });


    } catch (error) {

        return jsonOutput({

            ok: false,

            message:
                String(error)

        });

    }

}



/* =====================================================
   POST REQUEST
===================================================== */

function doPost(e) {

    try {

        if (
            !e ||
            !e.postData ||
            !e.postData.contents
        ) {

            return jsonOutput({

                ok: false,

                message:
                    "لا توجد بيانات"

            });

        }


        const body =
            JSON.parse(
                e.postData.contents
            );


        /* ---------------------------------------------
           UPDATE VEHICLE
        --------------------------------------------- */

        if (
            body.action ===
            "updateVehicle"
        ) {

            return jsonOutput(
                updateVehicle(body)
            );

        }


        return jsonOutput({

            ok: false,

            message:
                "Action غير معروف"

        });


    } catch (error) {

        return jsonOutput({

            ok: false,

            message:
                String(error)

        });

    }

}



/* =====================================================
   GET SHEET
===================================================== */

function getSheet() {

    const spreadsheet =
        SpreadsheetApp
            .getActiveSpreadsheet();


    let sheet =
        spreadsheet
            .getSheetByName(
                SHEET_NAME
            );


    /*
       إنشاء الورقة إذا لم تكن موجودة
    */

    if (!sheet) {

        sheet =
            spreadsheet.insertSheet(
                SHEET_NAME
            );

    }


    ensureHeaders(sheet);

    ensureRows(sheet);


    return sheet;

}



/* =====================================================
   ENSURE HEADERS
===================================================== */

function ensureHeaders(sheet) {

    const currentHeaders =
        sheet
            .getRange(
                1,
                1,
                1,
                HEADERS.length
            )
            .getValues()[0];


    let headersMatch = true;


    for (
        let i = 0;
        i < HEADERS.length;
        i++
    ) {

        if (
            String(
                currentHeaders[i] || ""
            ) !== HEADERS[i]
        ) {

            headersMatch = false;

            break;

        }

    }


    if (!headersMatch) {

        sheet
            .getRange(
                1,
                1,
                1,
                HEADERS.length
            )
            .setValues([
                HEADERS
            ]);

    }

}



/* =====================================================
   ENSURE 100 VEHICLE ROWS
===================================================== */

function ensureRows(sheet) {

    const requiredRows =
        MAX_VEHICLES + 1;


    const currentRows =
        sheet.getMaxRows();


    if (
        currentRows <
        requiredRows
    ) {

        sheet.insertRowsAfter(

            currentRows,

            requiredRows -
            currentRows

        );

    }


    /*
       SN من 1 إلى 100
    */

    const serialNumbers = [];


    for (
        let i = 1;
        i <= MAX_VEHICLES;
        i++
    ) {

        serialNumbers.push([
            i
        ]);

    }


    sheet
        .getRange(
            2,
            1,
            MAX_VEHICLES,
            1
        )
        .setValues(
            serialNumbers
        );

}



/* =====================================================
   GET VEHICLES
===================================================== */

function getVehicles() {

    const sheet =
        getSheet();


    const values =
        sheet
            .getRange(
                2,
                1,
                MAX_VEHICLES,
                HEADERS.length
            )
            .getDisplayValues();


    const vehicles = [];


    for (
        let i = 0;
        i < values.length;
        i++
    ) {

        const row =
            values[i];


        vehicles.push({

            id:
                i + 1,


            serial:
                row[0] ||
                String(i + 1),


            number:
                row[1] ||
                "",


            vehicleStatus:
                normalizeVehicleStatus(
                    row[2]
                ),


            driver:
                row[3] ||
                "",


            driverStatus:
                normalizeDriverStatus(
                    row[4]
                ),


            maintenance:
                row[5] ||
                "none",


            notes:
                row[6] ||
                "",


            updatedAt:
                row[7] ||
                ""

        });

    }


    return vehicles;

}



/* =====================================================
   UPDATE VEHICLE
===================================================== */

function updateVehicle(data) {

    const id =
        Number(
            data.id
        );


    /*
       التحقق من رقم البطاقة
    */

    if (
        !id ||
        id < 1 ||
        id > MAX_VEHICLES
    ) {

        return {

            ok: false,

            message:
                "رقم المركبة غير صحيح"

        };

    }


    /*
       رقم المركبة مطلوب
    */

    if (
        String(
            data.number || ""
        ).trim() === ""
    ) {

        return {

            ok: false,

            message:
                "رقم أو اسم المركبة مطلوب"

        };

    }


    const sheet =
        getSheet();


    /*
       الصف الفعلي في Google Sheets
       لأن الصف الأول للعناوين
    */

    const row =
        id + 1;


    /*
       وقت التحديث
    */

    const updatedAt =
        data.updatedAt
            ? new Date(
                data.updatedAt
            )
            : new Date();


    /*
       تجهيز البيانات
    */

    const values = [[

        id,

        String(
            data.number || ""
        ).trim(),

        normalizeVehicleStatus(
            data.vehicleStatus
        ),

        String(
            data.driver || ""
        ).trim(),

        normalizeDriverStatus(
            data.driverStatus
        ),

        String(
            data.maintenance ||
            "none"
        ),

        String(
            data.notes || ""
        ).trim(),

        updatedAt

    ]];


    /*
       حفظ البيانات
    */

    sheet
        .getRange(
            row,
            1,
            1,
            HEADERS.length
        )
        .setValues(
            values
        );


    /*
       تنسيق التاريخ
    */

    sheet
        .getRange(
            row,
            8
        )
        .setNumberFormat(
            "yyyy-MM-dd HH:mm:ss"
        );


    /*
       إرجاع البيانات
    */

    return {

        ok: true,

        message:
            "تم حفظ الحالة بنجاح",

        vehicle: {

            id: id,

            serial: id,

            number:
                values[0][1],

            vehicleStatus:
                values[0][2],

            driver:
                values[0][3],

            driverStatus:
                values[0][4],

            maintenance:
                values[0][5],

            notes:
                values[0][6],

            updatedAt:
                updatedAt.toISOString()

        }

    };

}



/* =====================================================
   NORMALIZE VEHICLE STATUS
===================================================== */

function normalizeVehicleStatus(value) {

    const status =
        String(
            value || ""
        )
        .toLowerCase()
        .trim();


    if (

        status ===
            "working"

        ||

        status ===
            "تعمل"

        ||

        status ===
            "true"

        ||

        status ===
            "1"

    ) {

        return "working";

    }


    return "stopped";

}



/* =====================================================
   NORMALIZE DRIVER STATUS
===================================================== */

function normalizeDriverStatus(value) {

    const status =
        String(
            value || ""
        )
        .toLowerCase()
        .trim();


    if (

        status ===
            "present"

        ||

        status ===
            "حاضر"

        ||

        status ===
            "true"

        ||

        status ===
            "1"

    ) {

        return "present";

    }


    return "absent";

}



/* =====================================================
   JSON RESPONSE
===================================================== */

function jsonOutput(data) {

    return ContentService

        .createTextOutput(
            JSON.stringify(data)
        )

        .setMimeType(
            ContentService.MimeType.JSON
        );

}
