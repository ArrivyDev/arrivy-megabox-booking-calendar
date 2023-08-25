/* Arrivy Bookings Widget Start */
let initialASW = null;

const formToDateFieldName = {
    "Self Move In": "Move-In-Date",
    "To Door": "Date-2",
};

const deliveryTypeToFormId = {
    "Self Move In": "wf-form-Self-Move-In",
    "To Door": "wf-form-Deliever-To-Door",
};

const getDeliveryType = () => {
    return $("input[name='Delivery-Type']:checked").val();
};

const getFormId = () => {
    return deliveryTypeToFormId[getDeliveryType()];
};

const getDateSelectorName = () => {
    return formToDateFieldName[getDeliveryType()];
};

const createTemplateExtraField = (key, val) => {
    return {
        name: key,
        type: "TEXT",
        value: val,
    };
};

const prepareTask = () => {
    const templateExtraFieldToFormField = {
        "Space Required": "needed-space",
        "Storage Duration": "time-to-store",
        Service: "service-you-are-after",
    };

    const taskFieldToFormField = {
        customer_city: "city-2",
        customer_state: "state",
        customer_country: "country-2",
        customer_zipcode: "Postcode",
        customer_address_line_1: "Address-2",
        customer_email: "Email-5",
        customer_mobile_number: "Phone-3",
        customer_first_name: "First-Name-3",
        customer_last_name: "Last-Name-3",
    };

    const task = {};
    const formId = getFormId();

    const templateExtraFields = [];

    Object.keys(templateExtraFieldToFormField).forEach((key) => {
        const val = $(
            "#" +
            formId +
            " input[name='" +
            templateExtraFieldToFormField[key] +
            "']:checked"
        ).val();
        if (val !== undefined)
            templateExtraFields.push(createTemplateExtraField(key, val));
    });

    templateExtraFields.push(
        createTemplateExtraField(
            "Delivery Type",
            $("input[name='Delivery-Type']:checked").val()
        )
    );

    Object.keys(taskFieldToFormField).forEach((key) => {
        const val = $(
            "#" + formId + " input[name='" + taskFieldToFormField[key] + "']"
        ).val();
        if (val !== undefined) task[key] = val;
    });

    const lat = $("#" + formId + " input[name='latitude-3']").val();

    const lng = $("#" + formId + " input[name='longitude-2']").val();
    undefined;
    if (lat && lng) {
        task["customer_exact_location"] = { lat: lat, lng: lng };
    }

    if (templateExtraFields.length)
        task["template_extra_fields"] = templateExtraFields;

    return task;
};

$(document).ready(function () {
    $(".toggle-aqw-widget").on("focus", function () {
        $(this).closest(".form-field-wrapper").find(".aqw-widget").toggle();
    })
    $(".get-quote").on("click", (e) => {
        e.preventDefault();
        if (!initialASW.get("selected_slot")) {
            initialASW.toast({ type: "error", message: "Please Select Slot" });
            return;
        }
        const task = prepareTask();
        task.title = initialASW.generateBookingTaskTitle(task);
        initialASW.bookSlot(task);
    });
    $("input[name='Delivery-Type']").on("change", () => {
        // initialize widget according to move type
        initialASW = new ArrivySchedulingWidget({
            booking_url:
                "ahRzfnRyYWNraW5nLWFwaS1tdWhpb3ItCxIMVXNlclNoYWRvdzIzGICAwPLAyekIDAsSB0Jvb2tpbmcYgICwiK2puwgM",
            selector: ".aqw-widget",
        });
        initialASW.renderInitialBooking();

        initialASW.setOnSlotSelect((selectedSlot) => {
            const formId = getFormId();
            $("#" + formId + " input[name='" + getDateSelectorName() + "']").val(
                moment(selectedSlot.start_datetime)
                    .local()
                    .format("YYYY-MM-DD, h:mm A")
            );
            $(
                "#" + formId + " input[name='" + getDateSelectorName() + "']"
            ).closest(".form-field-wrapper").find(".aqw-widget").hide(); // not working right now, class is being removed but date picker is not hiding
            $(
                "#" + formId + " input[name='" + getDateSelectorName() + "']"
            ).removeClass("invalid"); // not working right now, class is being removed but date picker is not hiding
            $("#" + formId + " input[name='" + getDateSelectorName() + "']")
                .parent()
                .find(".invalid-text")
                .remove();
        });

        initialASW.setOnBookingSuccess((res) => {
            initialASW.set({ 'selected_slot': null })
            initialASW.renderInitialBooking();
            initialASW.toast({ type: 'success', message: 'Request Submitted Successfully' })
            $('#' + getFormId())[0].reset()
        });
        initialASW.setOnBookingError((err) => {
            const formId = getFormId();
            const description = JSON.parse(err.responseText).description;
            console.error(err);
            if (description === "The slot has already been booked") {
                initialASW.renderInitialBooking();
            }

            let errorElement = $(
                "#" + formId + " input[name='" + getDateSelectorName() + "']"
            )
                .parent()
                .find(".invalid-text")
                .first();
            if (errorElement.length) {
                errorElement[0].innerHTML = description;
            } else {
                $("#" + formId + " input[name='" + getDateSelectorName() + "']")
                    .parent()
                    .append(`<div class="invalid-text">${description}</div>`);
            }
        });
    });
});

/* Arrivy Bookings Widget End */
