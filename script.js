/* Arrivy Bookings Widget Start */
const formToDateFieldName = {
    "Self Move In": "Move-In-Date",
    "To Door": "Drop-Off-Date",
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
        "Space Required": "Needed-Space",
        "Storage Duration": "Time-to-Store",
        "Service": "service-you-are-after",
    };

    const taskFieldToFormFielSelfMoveIn = {
        customer_email: "Email-5",
        customer_mobile_number: "Phone-3",
        customer_first_name: "First-Name-3",
        customer_last_name: "Last-Name-3",
    };

    const taskFieldToFormFieldDeliverToDoor = {
        customer_city: "city-2",
        customer_state: "state",
        customer_country: "country-2",
        customer_zipcode: "Postcode",
        customer_address_line_1: "Address",
        customer_email: "Email",
        customer_mobile_number: "Phone",
        customer_first_name: "First-Name",
        customer_last_name: "Last-Name",
    };

    const taskFieldToFormFieldMap = {
        "Self Move In": taskFieldToFormFielSelfMoveIn,
        "To Door": taskFieldToFormFieldDeliverToDoor,
    };

    const priceTemplateExtraFields = {
        "Per Month Price": "aqw-per-month-price",
        "Delivery Price": "aqw-delivery-price",
        "Re Delivery Price": "aqw-re-delivery-price",
        "Service Price": "aqw-service-price",
        "Zone Price": "aqw-zone-price",
        "Total Price": "aqw-total-price",
        "Total Price Upfront": "aqw-total-price-upfront"
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

    Object.keys(priceTemplateExtraFields).map((key) => {
        let val = undefined
        const valFromNested = $('#' + formId + ' .' + priceTemplateExtraFields[key] + ' span')
        const valFromDirect = $('#' + formId + ' .' + priceTemplateExtraFields[key])

        if (valFromNested.length > 0)
            val = valFromNested.text()
        else if (valFromDirect.length > 0)
            val = valFromDirect.text()

        if (val != undefined)
            val = parseFloat(val.replace(/[^0-9.-]+/g, ''));
        if (val !== undefined && !isNaN(val))
            templateExtraFields.push(
                createTemplateExtraField(
                    key,
                    val
                )
            );
    })
    const storageDuration = templateExtraFields.find(t => t.name === "Storage Duration")
    if (storageDuration && storageDuration.value && storageDuration.value.toLowerCase() !== "month to month") {
        // need to modify Total Price Upfront according to the price displayed on page
        const totalPriceUpfrontIndex = templateExtraFields.findIndex(t => t.name === "Total Price Upfront")
        if (totalPriceUpfrontIndex !== -1) {
            const pricesToSkipFromTotalPriceUpfrontCalculation = ["Total Price Upfront", "Total Price"]
            let totalPriceUpfront = 0.0
            templateExtraFields.map(t => {
                if (t.name in priceTemplateExtraFields && pricesToSkipFromTotalPriceUpfrontCalculation.indexOf(t.name) === -1 && [undefined, ''].indexOf(t.value) === -1) {
                    totalPriceUpfront += parseFloat(t.value)
                }
            })
            templateExtraFields[totalPriceUpfrontIndex].value = totalPriceUpfront
        }
    }

    const taskFieldToFormField = taskFieldToFormFieldMap[getDeliveryType()]

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

const createBooking = () => {
    const task = prepareTask();
    task.title = formToWidget[getFormId()].generateBookingTaskTitle(task);
    formToWidget[getFormId()].bookSlot(task);
}

const hidePopup = () => {
    $('#' + getFormId() + ' .popup .close-button').click()
}
const formToWidget = {
    'wf-form-Self-Move-In': null,
    'wf-form-Deliever-To-Door': null
}

const initiateWidget = () => {

    // initialize widget according to move type
    const formId = getFormId();
    const initialASW = formToWidget[formId] ?? new ArrivySchedulingWidget({
        booking_url:
            "ahRzfnRyYWNraW5nLWFwaS1tdWhpb3ItCxIMVXNlclNoYWRvdzIzGICA0IL4taYJDAsSB0Jvb2tpbmcYgIDQg4jkpAgM",
        selector: `#${formId} .aqw-widget`,
    });
    formToWidget[formId] = initialASW
    initialASW.renderInitialBooking();

    initialASW.setOnSlotSelect((selectedSlot) => {
        const formId = getFormId();
        $("#" + formId + " input[name='" + getDateSelectorName() + "']").val(
            moment.utc(selectedSlot.start_datetime).tz(formToWidget[formId].get('timezone'))
                .format("YYYY-MM-DD")
        );
        $("#" + formId + " input[name='Drop-Off-Time']:nth(0)").val(
            moment.utc(selectedSlot.start_datetime).tz(formToWidget[formId].get('timezone'))
                .format("h:mm A")
        );
        $("#" + formId + " input[name='Drop-Off-Time'][value='" + moment.utc(selectedSlot.start_datetime).tz(formToWidget[formId].get('timezone'))
            .format("h:mm A") + "']").prop(true)
        $('#' + $("#" + getFormId() + " input[name='Drop-Off-Time'][value='" + moment.utc(selectedSlot.start_datetime).tz(formToWidget[formId].get('timezone'))
            .format("h:mm A") + "']").parent().attr('id')).click()
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
        const formId = getFormId();
        $('#' + formId)[0].reset();
        $('#' + formId + ' input[type=submit]').val('Request Booking');
        hidePopup();
        $('#' + formId).closest('.w-form').find('.w-form-done').show();
        $('#' + formId).hide();

    });
    initialASW.setOnBookingError((err) => {
        const formId = getFormId();
        $('#' + formId + ' input[type=submit]').val('Request Booking')

        const description = JSON.parse(err.responseText).description;
        console.error(err);
        if (description === "The slot has already been booked") {
            initialASW.renderInitialBooking();
            hidePopup();
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
}

$(document).ready(function () {
    $('.get-quote').on('click', function (e) {
        $('#' + getFormId() + ' .request-booking').attr('data-create-task', true)
    })
    $('.decide-later').on('click', function (e) {
        $('#' + getFormId() + ' .request-booking').attr('data-create-task', false)
    })
    $(".request-booking").on("click", function (e) {
        if ((/true/).test($(this).attr('data-create-task'))) {
            $(this).val('Please wait...')
            e.preventDefault();
            createBooking();
        }
    });
    if (window.location.search.toLowerCase().includes("location")) {
        initiateWidget()
    }
    $("input[name='Delivery-Type']").on("change", initiateWidget);
});

/* Arrivy Bookings Widget End */