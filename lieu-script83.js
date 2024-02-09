document.addEventListener("DOMContentLoaded", function () {
    let container1Data = {};
    let container2Data = {};
    let initialSelectedDate, secondContainerVisible = false;
    const today = new Date(), tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = flatpickr("#date", {
        altInput: true, altFormat: "d/m/y", locale: "fr", enableTime: false, minDate: today,
        disable: [function (date) {
            return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        }],
        onChange: function (selectedDates) {
            console.log("Date selection changed", selectedDates);
            if (selectedDates.length > 0) {
                initialSelectedDate = selectedDates[0];
                $(".date-heading").eq(0).text(formatDate(selectedDates[0]));
                updateCheckboxOptions(selectedDates, "container1");
                updateMoreDaysButton(selectedDates);
            }
            if (secondContainerVisible) {
                $(".checkbox-container").eq(1).hide();
                $(".date-heading").eq(1).hide();
                secondContainerVisible = false;
            }
            if (selectedDates.length > 1) {
                const secondDate = selectedDates[1];
                const secondCheckboxContainer = $(".checkbox-container[data-id='container2']");
                secondCheckboxContainer.html($(".checkbox-container[data-id='container1']").html());
                updateCheckboxOptions([secondDate], "container2");
                $(".date-heading").eq(1).text(formatDate(secondDate));
                $(".date-heading").eq(1).show();
                secondCheckboxContainer.show();
                secondContainerVisible = true;
            }
            resetSelections();
            mergeDataAndUpdateInput();
        }
    });

    const dateFullDisabledInput = document.querySelector('#datefulldisabled');

    function resetSelections() {
        container1Data = {};
        container2Data = {};
        console.log("Selections reset");
        processSelections();
    }

    $('.moredays').click(function() {
        secondContainerVisible = !secondContainerVisible;
        console.log("More days button clicked, second container visibility: ", secondContainerVisible);
        if (secondContainerVisible) {
            setupSecondContainer();
        } else {
            $(".checkbox-container").eq(1).hide();
            $(".date-heading").eq(1).hide();
        }
    });

    function setupSecondContainer() {
        const secondDate = new Date(initialSelectedDate);
        secondDate.setDate(secondDate.getDate() + 1);
        $(".date-heading").eq(1).text(formatDate(secondDate));
        $(".checkbox-container[data-id='container2']").show();
        $(".date-heading").eq(1).show();
        updateCheckboxOptions([secondDate], "container2");
        console.log("Setting up second container for next day");
    }

    function processSelections() {
        console.log("Processing selections for both containers");
        processContainerSelections('container1', formatDate(initialSelectedDate));
        if (secondContainerVisible) {
            const nextDay = new Date(initialSelectedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            processContainerSelections('container2', formatDate(nextDay));
        }
        mergeDataAndUpdateInput();
    }

    function processContainerSelections(containerId, dateStr) {
        console.log(`Processing selections for ${containerId} on ${dateStr}`);
        let selectedHours = getSelectedHours(containerId);
        adjustSelectionsForDayTransition(selectedHours, dateStr, containerId);
        updateContainerData(containerId, dateStr, selectedHours);
    }

    function getSelectedHours(containerId) {
        let selectedHours = [];
        $(`.checkbox-container[data-id='${containerId}'] .checkbox-hour:checked`).each(function() {
            selectedHours.push(parseInt($(this).val().split(':')[0], 10));
        });
        console.log(`Selected hours in ${containerId}:`, selectedHours);
        return selectedHours.sort((a, b) => a - b);
    }

    function adjustSelectionsForDayTransition(selectedHours, dateStr, containerId) {
        console.log(`Adjusting selections for day transition in ${containerId}:`, selectedHours);
        if (selectedHours.length > 0) {
            const firstHour = selectedHours[0];
            const lastHour = selectedHours[selectedHours.length - 1];
            addTimeRange(firstHour - 1, dateStr, containerId);
            addTimeRange(lastHour + 1, dateStr, containerId);
        }
    }

    function updateContainerData(containerId, dateStr, selectedHours) {
        console.log(`Updating container data for ${containerId}:`, selectedHours);
        let dataToUpdate = containerId === 'container1' ? container1Data : container2Data;
        dataToUpdate[dateStr] = [];
        selectedHours.forEach(hour => {
            let hourRange = hourToRangeString(hour);
            if (!dataToUpdate[dateStr].includes(hourRange)) {
                dataToUpdate[dateStr].push(hourRange);
            }
            if (hour === 0) {
                let previousDay = adjustDateStr(dateStr, -1);
                addTimeRange(23, previousDay, containerId);
            } else if (hour === 23) {
                let nextDay = adjustDateStr(dateStr, 1);
                addTimeRange(0, nextDay, containerId);
            }
        });
    }

    function mergeDataAndUpdateInput() {
        let mergedData = {};
        Object.keys(container1Data).forEach(date => {
            if (!mergedData[date]) mergedData[date] = [];
            mergedData[date] = mergedData[date].concat(container1Data[date] || []);
        });
        Object.keys(container2Data).forEach(date => {
            if (!mergedData[date]) mergedData[date] = [];
            mergedData[date] = mergedData[date].concat(container2Data[date] || []);
        });
        console.log("Merged data:", mergedData);
        $('.firstdateinput').val(JSON.stringify(mergedData));
        updateDateFullDisabled();
    }

    document.addEventListener('change', function(event) {
        if ($(event.target).closest('.checkbox-container').length) {
            console.log("Change detected in container: ", $(event.target).closest('.checkbox-container').data('id'));
            processSelections();
        }
    });

    function updateDateFullDisabled() {
        console.log("Updating dateFullDisabledInput");
        const updatedData = {};
        Object.keys(container1Data).concat(Object.keys(container2Data)).forEach(date => {
            const hours = [...(container1Data[date] || []), ...(container2Data[date] || [])];
            if (hours.length > 0) {
                updatedData[date] = hours;
            }
        });
        dateFullDisabledInput.value = JSON.stringify(updatedData);
        console.log("Updated dateFullDisabledInput:", dateFullDisabledInput.value);
    }

    function hourToRangeString(hour) {
        let startHour = hour % 24;
        let endHour = (hour + 1) % 24;
        return `${startHour}h à ${endHour}h`;
    }

    function addTimeRange(hour, dateStr, containerId) {
        console.log(`Adding time range for hour ${hour} on ${dateStr} in ${containerId}`);
        let newDateStr = dateStr;
        if (hour < 0) {
            newDateStr = adjustDateStr(dateStr, -1);
            hour = 23;
        } else if (hour > 23) {
            newDateStr = adjustDateStr(dateStr, 1);
            hour = 0;
        }
        const range = hourToRangeString(hour);
        let dataToUpdate = containerId === 'container1' ? container1Data : container2Data;
        if (!dataToUpdate[newDateStr]) dataToUpdate[newDateStr] = [];
        if (!dataToUpdate[newDateStr].includes(range)) {
            dataToUpdate[newDateStr].push(range);
        }
    }

    function removeTimeRange(hour, dateStr, containerId) {
        console.log(`Removing time range for hour ${hour} on ${dateStr} in ${containerId}`);
        let newDateStr = dateStr;
        if (hour < 0) {
            newDateStr = adjustDateStr(dateStr, -1);
            hour = 23;
        } else if (hour > 23) {
            newDateStr = adjustDateStr(dateStr, 1);
            hour = 0;
        }
        let dataToUpdate = containerId === 'container1' ? container1Data : container2Data;
        const rangeToRemove = hourToRangeString(hour);
        dataToUpdate[newDateStr] = (dataToUpdate[newDateStr] || []).filter(range => range !== rangeToRemove);
    }

    function adjustDateStr(dateStr, dayOffset) {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + dayOffset);
        return date.toISOString().split('T')[0];
    }

    function updateCheckboxOptions(selectedDates, containerId) {
        console.log(`Updating checkbox options for ${containerId}`);
        const openingHourStr = $('#ouverture-lieu').text();
        const openingHour = parseInt(openingHourStr.split(/[:h]/)[0]);
        const closingHourStr = $('#fermeture-lieu').text();
        const closingHour = parseInt(closingHourStr.split(/[:h]/)[0]);
        const checkboxContainer = $(`.checkbox-container[data-id="${containerId}"]`);
        checkboxContainer.empty();
        for (let hour = openingHour; hour < closingHour; hour++) {
            const hourRange = hourToRangeString(hour);
            const checkboxDiv = $("<div>", { class: "checkbox-item" });
            const label = $("<label>", { text: hourRange }).appendTo(checkboxDiv);
            $("<input>", { type: "checkbox", value: `${hour}`, class: "checkbox-hour" }).appendTo(label);
            checkboxContainer.append(checkboxDiv);
        }
    }

    function updateMoreDaysButton(selectedDates) {
        console.log("Updating more days button state");
        const moreDaysButton = $(".moredays");
        moreDaysButton.prop('disabled', selectedDates.length > 0 && (selectedDates[0].getDate() === tomorrow.getDate() || selectedDates.length > 1));
    }

    function formatDate(date) {
        return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    $('.checkbox-hour').change(function() {
        console.log("Checkbox hour changed");
        const containerId = $(this).closest('.checkbox-container').data('id');
        const selectedDates = dateInput.selectedDates;
        updateFirstDateInput(selectedDates, containerId);
        processSelections();
    });

    function updateFirstDateInput(selectedDates, containerId) {
        console.log(`Updating first date input from ${containerId}`);
        let dataToUpdate = containerId === 'container1' ? container1Data : container2Data;
        const dateIndex = containerId === 'container1' ? 0 : 1;
        const selectedDate = selectedDates[dateIndex];
        if (!selectedDate) return;

        const formattedSelectedDate = formatDate(selectedDate);
        let currentSelections = dataToUpdate[formattedSelectedDate] || [];

        dataToUpdate[formattedSelectedDate] = currentSelections;
        const selectedHours = getSelectedHours(containerId);

        selectedHours.forEach(hour => {
            addTimeRange(hour, formattedSelectedDate, containerId);
        });

        if (selectedHours.length > 0) {
            const firstHour = selectedHours[0];
            const lastHour = selectedHours[selectedHours.length - 1];
            addTimeRange(firstHour - 1, formattedSelectedDate, containerId);
            addTimeRange(lastHour + 1, formattedSelectedDate, containerId);
        } else {
            removeTransitionalHours(formattedSelectedDate, dataToUpdate);
        }

        mergeDataAndUpdateInput();
    }

    function removeTransitionalHours(dateStr, data) {
        console.log(`Removing transitional hours for date ${dateStr}`);
        const previousDayStr = adjustDateStr(dateStr, -1);
        const nextDayStr = adjustDateStr(dateStr, 1);
        removeTimeRange(23, previousDayStr, data, true);
        removeTimeRange(0, nextDayStr, data, true);
    }

    function updateAdditionalHours(currentlySelectedHoursSet, dateStr, data) {
        console.log(`Updating additional hours for ${dateStr}`);
        if (currentlySelectedHoursSet.size > 0) {
            const sortedHours = [...currentlySelectedHoursSet].sort((a, b) => a - b);
            const firstHour = sortedHours[0];
            const lastHour = sortedHours[sortedHours.length - 1];
            addTimeRange(firstHour - 1, dateStr, data);
            addTimeRange(lastHour + 1, dateStr, data);
        }
    }

    function getExistingData() {
        const existingDataElement = document.querySelector('.paragraph-dhours');
        if (!existingDataElement) return {};
        try {
            return JSON.parse(existingDataElement.textContent.trim());
        } catch (error) {
            console.error("Error parsing JSON:", error);
            return {};
        }
    }

    function mergeDataAndUpdateInput() {
        console.log("Merging data and updating input");
        let mergedData = {};
        const existingData = getExistingData();
        let allDates = new Set([...Object.keys(container1Data), ...Object.keys(container2Data), ...Object.keys(existingData)]);
        allDates.forEach(date => {
            let dataFromContainer1 = container1Data[date] || [];
            let dataFromContainer2 = container2Data[date] || [];
            let existingDataForDate = existingData[date] || [];
            mergedData[date] = [...new Set([...dataFromContainer1, ...dataFromContainer2, ...existingDataForDate])];
        });
        $('.firstdateinput').val(JSON.stringify(mergedData));
        updateDateFullDisabled();
    }

    console.log("Script setup complete.");
});
