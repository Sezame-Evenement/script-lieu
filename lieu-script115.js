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
        processSelections();
    }
    
    $('.moredays').click(function() {
        secondContainerVisible = !secondContainerVisible; // Toggle visibility
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
        updateCheckboxOptions([secondDate], "container2"); // Regenerate checkboxes for the second container
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
        mergeDataAndUpdateInput(); // Combine data from both containers
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
        return selectedHours.sort((a, b) => a - b);
    }

    function adjustSelectionsForDayTransition(selectedHours, dateStr, containerId) {
        if (selectedHours.length > 0) {
            const firstHour = selectedHours[0];
            const lastHour = selectedHours[selectedHours.length - 1];
            addTimeRange(firstHour - 1, dateStr, containerId); // Adjust for previous day if hour is 0
            addTimeRange(lastHour + 1, dateStr, containerId); // Adjust for next day if hour is 23
        }
    }
    
    function updateContainerData(containerId, dateStr, selectedHours) {
        let dataToUpdate = containerId === 'container1' ? container1Data : container2Data;
        // Reset the date's data before updating
        dataToUpdate[dateStr] = [];
        
        // Update with new selections, mapping each hour to its range string
        selectedHours.forEach(hour => {
            let hourRange = hourToRangeString(hour);
            if (!dataToUpdate[dateStr].includes(hourRange)) {
                dataToUpdate[dateStr].push(hourRange);
            }
        });
    }

    function addTimeRange(hour, dateStr, containerId) {
        let dataToUpdate = containerId === 'container1' ? container1Data : container2Data;
        let newHour = hour;
        if (hour < 0) {
            newHour = 23;
            dateStr = adjustDateStr(dateStr, -1);
        } else if (hour > 23) {
            newHour = 0;
            dateStr = adjustDateStr(dateStr, 1);
        }
        const hourRange = hourToRangeString(newHour);
        if (!dataToUpdate[dateStr]) {
            dataToUpdate[dateStr] = [];
        }
        if (!dataToUpdate[dateStr].includes(hourRange)) {
            dataToUpdate[dateStr].push(hourRange);
        }
    }


    function hourToRangeString(hour) {
        let startHour = hour % 24;
        let endHour = (hour + 1) % 24;
        return `${startHour}h à ${endHour}h`;
    }
    
    function adjustDateStr(dateStr, dayOffset) {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + dayOffset);
        return date.toISOString().split('T')[0];
    }

    document.addEventListener('change', function(event) {
        if ($(event.target).closest('.checkbox-container').length) {
            console.log("Change detected in container: ", $(event.target).closest('.checkbox-container').data('id'));
            const selectedDates = dateInput.selectedDates;
            updateFirstDateInput(selectedDates, $(event.target).closest('.checkbox-container').data('id'));
            updateDateFullDisabled(selectedDates);
        }
    });

    function updateFirstDateInput(selectedDates, containerId) {
        // This function now needs to ensure that data from both containers are considered
        const dateIndex = containerId === 'container1' ? 0 : (containerId === 'container2' ? 1 : null);
        if(dateIndex === null) return; // exit if containerId is not recognized
        const selectedDate = selectedDates[dateIndex];
        if (!selectedDate) return; // exit if no date is selected

        const formattedSelectedDate = formatDateToISO(selectedDate);
        updateSelectionsFromUI(containerId, formattedSelectedDate);
        mergeDataAndUpdateInput();
    }

    function formatDateToISO(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    
    function updateSelectionsFromUI(containerId, formattedSelectedDate) {
        let dataToUpdate = containerId === 'container1' ? container1Data : container2Data;
        let checkboxes = $(`.checkbox-container[data-id='${containerId}'] .checkbox-hour:checked`);
        let selectedHours = checkboxes.map(function() { return parseInt($(this).val().split(':')[0], 10); }).get();
        dataToUpdate[formattedSelectedDate] = selectedHours.map(hour => hourToRangeString(hour)).sort();

        // Automatically adjust for first and last hour selections
        if(selectedHours.length > 0) {
            let firstHour = selectedHours[0] - 1;
            let lastHour = selectedHours[selectedHours.length - 1] + 1;
            addTimeRange(firstHour, formattedSelectedDate, containerId);
            addTimeRange(lastHour, formattedSelectedDate, containerId);
        }
    }

    function mergeDataAndUpdateInput() {
        let mergedData = {};
        Object.keys(container1Data).forEach(date => {
            mergedData[date] = container1Data[date];
        });
        Object.keys(container2Data).forEach(date => {
            if(mergedData[date]) {
                mergedData[date] = mergedData[date].concat(container2Data[date]).sort();
            } else {
                mergedData[date] = container2Data[date];
            }
        });

        $('.firstdateinput').val(JSON.stringify(mergedData));
        $('#datefulldisabled').val(JSON.stringify(mergedData));
    }

    function updateDateFullDisabled(selectedDates) {
        let updatedData = {};
        // Combine data from both containers for dateFullDisabled
        Object.keys(container1Data).concat(Object.keys(container2Data)).forEach(date => {
            updatedData[date] = [...(container1Data[date] || []), ...(container2Data[date] || [])];
        });
        // Set the value of dateFullDisabled input
        $('#datefulldisabled').val(JSON.stringify(updatedData));
    }
    
    function updateCheckboxOptions(selectedDates, containerId) {
        const checkboxContainer = $(`.checkbox-container[data-id='${containerId}']`);
        checkboxContainer.empty(); // Clear existing checkboxes
        selectedDates.forEach(date => {
            const formattedDate = formatDateToISO(date); // Assuming formatDateToISO is defined as before
            // Logic to determine if checkbox should be enabled or disabled
            // This is placeholder logic; adjust based on your actual requirements
            for (let hour = 0; hour < 24; hour++) {
                const hourRange = hourToRangeString(hour);
                const checkbox = $('<input>', {
                    type: 'checkbox',
                    class: 'checkbox-hour',
                    id: `checkbox-${containerId}-${hour}`,
                    value: hour
                });
                const label = $('<label>', {
                    for: `checkbox-${containerId}-${hour}`,
                    text: hourRange
                });
                const wrapper = $('<div>').append(checkbox).append(label);
                checkboxContainer.append(wrapper);
            }
        });
    }
    
    function updateMoreDaysButton(selectedDates) {
        // Logic to enable or disable the "more days" button based on the number of selected dates
        const moreDaysButton = $('.moredays');
        if (selectedDates.length > 1 || (selectedDates.length === 1 && selectedDates[0] !== initialSelectedDate)) {
            moreDaysButton.prop('disabled', true);
        } else {
            moreDaysButton.prop('disabled', false);
        }
    }
    

    function formatDate(date) {
        return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
});
