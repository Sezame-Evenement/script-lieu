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

    function resetSelections() {
        container1Data = {};
        container2Data = {};
        processSelections(); // Process selections after resetting
    }
    
    $('.moredays').on('click', function() {
        secondContainerVisible = !secondContainerVisible;
        setupSecondContainer();
    });
    
    function setupSecondContainer() {
        if (!secondContainerVisible) return;
        const secondDate = new Date(initialSelectedDate);
        secondDate.setDate(secondDate.getDate() + 1);
        $(".date-heading").eq(1).text(formatDate(secondDate));
        $(".checkbox-container").eq(1).show();
        $(".date-heading").eq(1).show();
        if (!$(".checkbox-container[data-id='container2']").html().trim()) {
            $(".checkbox-container[data-id='container2']").html($(".checkbox-container[data-id='container1']").html());
        }
        updateCheckboxOptions([secondDate], "container2");
    }
    
    function processSelections() {
        const date1Str = formatDate(initialSelectedDate);
        let date2Str = "";
        if (secondContainerVisible) {
            const secondDate = new Date(initialSelectedDate);
            secondDate.setDate(secondDate.getDate() + 1);
            date2Str = formatDate(secondDate);
        }
    
        processContainerSelections('container1', date1Str);
        if (secondContainerVisible) {
            processContainerSelections('container2', date2Str);
        }
    
        mergeDataAndUpdateInput();
    }
    
    function processContainerSelections(containerId, dateStr) {
        let dataToUpdate = containerId === 'container1' ? container1Data : container2Data;
        dataToUpdate[dateStr] = []; 
    
        $(`.checkbox-container[data-id='${containerId}'] .checkbox-hour:checked`).each(function() {
            const hour = parseInt($(this).val().split(':')[0], 10);
            addTimeRange(hour, dateStr, dataToUpdate);
        });
    
        handleTransitionalHours(dateStr, dataToUpdate);
    }
    
    function addTimeRange(hour, dateStr, dataToUpdate) {
        let hourStr = hourToRangeString(hour);
        if (!dataToUpdate[dateStr]) dataToUpdate[dateStr] = [];
        dataToUpdate[dateStr].push(hourStr);
    
        if (hour === 0) {
            let previousDayStr = adjustDateStr(dateStr, -1);
            let previousDayHourStr = hourToRangeString(23);
            if (!dataToUpdate[previousDayStr]) dataToUpdate[previousDayStr] = [];
            if (!dataToUpdate[previousDayStr].includes(previousDayHourStr)) {
                dataToUpdate[previousDayStr].push(previousDayHourStr);
            }
        } else if (hour === 23) {
            let nextDayStr = adjustDateStr(dateStr, 1);
            let nextDayHourStr = hourToRangeString(0);
            if (!dataToUpdate[nextDayStr]) dataToUpdate[nextDayStr] = [];
            if (!dataToUpdate[nextDayStr].includes(nextDayHourStr)) {
                dataToUpdate[nextDayStr].push(nextDayHourStr);
            }
        }
    }
    
    function handleTransitionalHours(dateStr, dataToUpdate) {
        
        if (dataToUpdate[dateStr].includes("0h à 1h")) {
            let prevDayStr = adjustDateStr(dateStr, -1);
            addTimeRange(23, prevDayStr, dataToUpdate); 
        }
    
        if (dataToUpdate[dateStr].includes("23h à 0h")) {
            let nextDayStr = adjustDateStr(dateStr, 1);
            addTimeRange(0, nextDayStr, dataToUpdate); 
        }
    }
    
    function hourToRangeString(hour) {
        const nextHour = (hour + 1) % 24;
        return `${hour.toString().padStart(2, '0')}h à ${nextHour.toString().padStart(2, '0')}h`;
    }
    
    function adjustDateStr(dateStr, dayOffset) {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + dayOffset);
        return date.toISOString().split('T')[0];
    }

    function mergeDataAndUpdateInput() {
        let mergedData = {};
        for (let date in container1Data) {
            if (!mergedData[date]) mergedData[date] = [];
            mergedData[date] = [...new Set([...mergedData[date], ...container1Data[date]])];
        }
        for (let date in container2Data) {
            if (!mergedData[date]) mergedData[date] = [];
            mergedData[date] = [...new Set([...mergedData[date], ...container2Data[date]])];
        }
        $('.firstdateinput').val(JSON.stringify(mergedData));
    }
    
    function updateFirstDateInput(selectedDates, containerId) {
        let dataToUpdate = containerId === 'container1' ? container1Data : container2Data;
        const dateIndex = containerId === 'container1' ? 0 : 1;
        const selectedDate = selectedDates[dateIndex];
        if (!selectedDate) return;
    
        const formattedSelectedDate = formatDate(selectedDate);
        // Clear previous data for this date to handle deselections properly
        dataToUpdate[formattedSelectedDate] = [];
    
        $(`.checkbox-container[data-id='${containerId}'] .checkbox-hour:checked`).each(function () {
            const hour = parseInt($(this).val().split(':')[0], 10);
            addTimeRange(hour, formattedSelectedDate, dataToUpdate);
        });
    
        // Add or remove transitional hours based on the current selections
        handleTransitionalHours(formattedSelectedDate, dataToUpdate);
    
        mergeDataAndUpdateInput();
    }
    
    function updateDateFullDisabled(selectedDates) {
        const updatedData = {};
        selectedDates.forEach(selectedDate => {
            const formattedSelectedDate = formatDate(selectedDate);
            updatedData[formattedSelectedDate] = [];
    
            $(`.checkbox-container .checkbox-hour:checked`).each(function () {
                const hour = parseInt($(this).val().split(':')[0], 10);
                addTimeRange(hour, formattedSelectedDate, updatedData);
            });
    
            // Adjust for transitions between days
            handleTransitionalHours(formattedSelectedDate, updatedData);
        });
    
        dateFullDisabledInput.value = JSON.stringify(updatedData);
    }
    
    function updateCheckboxOptions(selectedDates, containerId) {
        const openingHourStr = $('#ouverture-lieu').text();
        const openingHour = parseInt(openingHourStr.split(/[:h]/)[0]);
        const closingHourStr = $('#fermeture-lieu').text();
        const closingHour = parseInt(closingHourStr.split(/[:h]/)[0]);
        const disabledHoursElement = document.querySelector('.paragraph-dhours');
        const disabledHoursText = disabledHoursElement.textContent.trim();
        const disabledHours = parseJson(disabledHoursText) || {};
        const checkboxContainer = $(`.checkbox-container[data-id="${containerId}"]`);
        checkboxContainer.empty();
        const upperLimitHour = (containerId === 'container2') ? closingHour : 24;
        for (let hour = 0; hour < upperLimitHour; hour++) {
            const isWithinRange = (closingHour > openingHour) ? (hour >= openingHour && hour < closingHour) : (hour >= openingHour || hour < closingHour);
            if (isWithinRange) {
                const isDisabled = selectedDates.some(selectedDate => {
                    const formattedSelectedDate = formatDate(selectedDate);
                    return (disabledHours[formattedSelectedDate] || [])
                        .some(disabledHour => {
                            const [start, end] = disabledHour.split(' à ');
                            const [startHour] = start.split('h');
                            const [endHour] = end.split('h');
                            const selectedHour = parseInt(hour);
                            return (startHour === '23' && endHour === '0' && (selectedHour === 23 || selectedHour === 0)) || (startHour !== '23' && selectedHour >= parseInt(startHour) && selectedHour < parseInt(endHour));
                        });
                });
                const formattedHour = `${hour.toString().padStart(2, '0')}h00 à ${((hour + 1) % 24).toString().padStart(2, '0')}h00`;
                const checkboxDiv = $("<div>", { class: "checkbox-item" });
                const label = $("<label>", { text: formattedHour, for: `checkbox-${containerId}-${hour}`, style: isDisabled ? "color: #777; text-decoration: line-through; cursor: not-allowed;" : "" });
                const checkbox = $("<input>", { type: "checkbox", value: `${hour}:00`, id: `checkbox-${containerId}-${hour}`, class: "checkbox-hour", disabled: isDisabled, name: `checkbox-${containerId}` });
                checkboxDiv.append(label);
                checkboxDiv.append(checkbox);
                checkboxContainer.append(checkboxDiv);
            }
        }
    }
    
    function updateMoreDaysButton(selectedDates) {
        const moreDaysButton = $(".moredays");
        moreDaysButton.prop('disabled', selectedDates.length > 0 && (selectedDates[0].getDate() === tomorrow.getDate() || selectedDates.length > 1));
    }
    
    function formatDate(date) {
        return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    function parseJson(jsonString) {
        try { return JSON.parse(jsonString); }
        catch (error) { console.error("Error parsing JSON:", error); return {}; }
    }
    
    // Helper functions for time range management
    function addTimeRange(hour, dateStr, dataToUpdate) {
        let newDateStr = dateStr;
        if (hour < 0) {
            newDateStr = adjustDateStr(dateStr, -1); // Adjust for the previous day
            hour = 23;
        } else if (hour > 23) {
            newDateStr = adjustDateStr(dateStr, 1); // Adjust for the next day
            hour = 0;
        }
        const range = hourToRangeString(hour);
        if (!dataToUpdate[newDateStr]) dataToUpdate[newDateStr] = [];
        if (!dataToUpdate[newDateStr].includes(range)) {
            dataToUpdate[newDateStr].push(range);
        }
    }
    
    function removeTimeRange(hour, dateStr, dataToUpdate, forceRemoval = false) {
        let newDateStr = dateStr;
        if (hour < 0) {
            newDateStr = adjustDateStr(dateStr, -1); // Adjust for the previous day
            hour = 23;
        } else if (hour > 23) {
            newDateStr = adjustDateStr(dateStr, 1); // Adjust for the next day
            hour = 0;
        }
        const range = hourToRangeString(hour);
        if (forceRemoval || dataToUpdate[newDateStr]?.includes(range)) {
            dataToUpdate[newDateStr] = (dataToUpdate[newDateStr] || []).filter(r => r !== range);
        }
    }
    
    function adjustDateStr(dateStr, dayOffset) {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + dayOffset);
        return date.toISOString().split('T')[0];
    }
    
    function hourToRangeString(hour) {
        const nextHour = (hour + 1) % 24;
        return `${hour.toString().padStart(2, '0')}h à ${nextHour.toString().padStart(2, '0')}h`;
    }
    
});
