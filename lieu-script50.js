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

    $('.checkbox-container').on('change', '.checkbox-hour', function() {
        const containerId = $(this).closest('.checkbox-container').data('id');
        console.log(`Checkbox change detected in ${containerId}`);
        updateFirstDateInput(dateInput.selectedDates, containerId);
    });

    const dateFullDisabledInput = document.querySelector('#datefulldisabled');

    $('.moredays').click(function() {
        secondContainerVisible = !secondContainerVisible;
        if (secondContainerVisible) {
            const secondDate = new Date(initialSelectedDate);
            secondDate.setDate(secondDate.getDate() + 1);
            $(".date-heading").eq(1).text(formatDate(secondDate));
            $(".checkbox-container[data-id='container2']").show();
            $(".date-heading").eq(1).show();
            updateCheckboxOptions([secondDate], "container2");
        } else {
            $(".checkbox-container").eq(1).hide();
            $(".date-heading").eq(1).hide();
        }
    });

    function resetSelections() {
        container1Data = {};
        container2Data = {};
        processSelections();
    }

    
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
        console.log(`Updated data for ${containerId}:`, containerId === 'container1' ? container1Data : container2Data);
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
        // Logic to add one hour before the first and after the last hour, considering day transition
        console.log(`Adjusting day transition for ${containerId} with hours:`, selectedHours, `on date: ${dateStr}`);

        if (selectedHours.length > 0) {
            const firstHour = selectedHours[0];
            const lastHour = selectedHours[selectedHours.length - 1];
            addTimeRange(firstHour - 1, dateStr, containerId); // Adjust for previous day if hour is 0
            addTimeRange(lastHour + 1, dateStr, containerId); // Adjust for next day if hour is 23
        }
    }
    
    
    function updateContainerData(containerId, dateStr, selectedHours) {
        let dataToUpdate = containerId === 'container1' ? container1Data : container2Data;
        dataToUpdate[dateStr] = selectedHours.map(hour => hourToRangeString(hour));
        console.log(`Data updated for ${containerId} on ${dateStr}:`, dataToUpdate[dateStr]);
            
        // Update with new selections, mapping each hour to its range string
        selectedHours.forEach(hour => {
            let hourRange = hourToRangeString(hour);
            if (!dataToUpdate[dateStr].includes(hourRange)) {
                dataToUpdate[dateStr].push(hourRange);
            }
    
            // Handle adding transitional hours for 0 and 23 hours
            if (hour === 0) {
                let previousDay = adjustDateStr(dateStr, -1);
                addTimeRange(23, previousDay, containerId); // Adjust for the previous day
            } else if (hour === 23) {
                let nextDay = adjustDateStr(dateStr, 1);
                addTimeRange(0, nextDay, containerId); // Adjust for the next day
            }
        });
    }
    
    // This function encapsulates the logic for merging data and updating the input
    function mergeDataAndUpdateInput() {
        let mergedData = {};
        Object.keys(container1Data).forEach(date => {
            if (!mergedData[date]) mergedData[date] = [];
            mergedData[date] = [...new Set([...mergedData[date], ...container1Data[date]])];
        });
        Object.keys(container2Data).forEach(date => {
            if (!mergedData[date]) mergedData[date] = [];
            mergedData[date] = [...new Set([...mergedData[date], ...container2Data[date]])];
        });

        console.log("Merging data from both containers");
        $('.firstdateinput').val(JSON.stringify(mergedData));
        console.log("firstdateinput updated:", $('.firstdateinput').val());
    }
    
    document.addEventListener('change', function(event) {
        if ($(event.target).closest('.checkbox-container').length) {
            const containerId = $(event.target).closest('.checkbox-container').data('id');
            console.log('Change detected in container: ', containerId);
            const selectedDates = dateInput.selectedDates;
            updateFirstDateInput(selectedDates, containerId);
            updateDateFullDisabled(selectedDates);
        }
    });

    function hourToRangeString(hour) {
        let startHour = hour % 24;
        let endHour = (hour + 1) % 24;
        return `${startHour}h à ${endHour}h`;
    }

    function adjustDateStr(dateStr, dayOffset) {
        let date = new Date(dateStr);
        if (isNaN(date)) {
            console.error("Invalid date provided to adjustDateStr:", dateStr);
            return dateStr; // Return the original input to avoid further errors
        }
        date.setDate(date.getDate() + dayOffset);
        return date.toISOString().split('T')[0];
    }


    function addTimeRange(hour, dateStr, data) {
        let newDateStr = dateStr;
        if (hour < 0) {
            newDateStr = adjustDateStr(dateStr, -1); // Correctly adjust to the previous day
            hour = 23;
        } else if (hour > 23) {
            newDateStr = adjustDateStr(dateStr, 1); // Correctly adjust to the next day
            hour = 0;
        }
        const range = hourToRangeString(hour);
        if (!data[newDateStr]) data[newDateStr] = [];
        if (!data[newDateStr].includes(range)) {
            data[newDateStr].push(range);
        }
    }
    // Additional helper functions like `hourToRangeString`, `adjustDateStr`, and `addTimeRange` need to be correctly defined
    // to support the logic in `updateContainerData` and other parts of the script.
    
    function handleTimeSlot(hour, formattedSelectedDate, dataToUpdate, selectedDate, currentlySelectedHours, previouslySelectedHours) {
        const isSelected = currentlySelectedHours.has(hour);
        const wasSelected = previouslySelectedHours.has(hour);

        if (isSelected && !wasSelected) {
            addTimeRange(hour, formattedSelectedDate, dataToUpdate, selectedDate);
            addTimeRange(hour - 1, formattedSelectedDate, dataToUpdate, selectedDate);
            addTimeRange(hour + 1, formattedSelectedDate, dataToUpdate, selectedDate);
        } else if (!isSelected && wasSelected) {
            removeTimeRange(hour, formattedSelectedDate, dataToUpdate, selectedDate);
            removeTimeRange(hour - 1, formattedSelectedDate, dataToUpdate, selectedDate);
            removeTimeRange(hour + 1, formattedSelectedDate, dataToUpdate, selectedDate);
        }
    }

    function updateFirstDateInput(selectedDates, containerId) {
        let dataToUpdate = containerId === 'container1' ? container1Data : container2Data;
        const dateIndex = containerId === 'container1' ? 0 : (selectedDates.length > 1 ? 1 : 0);
        const selectedDate = selectedDates[dateIndex];
        if (!selectedDate) {
            console.warn(`No selected date for updateFirstDateInput in ${containerId}`);
            return;
        }
        const formattedSelectedDate = formatDate(selectedDate);
        console.log(`Updating ${containerId} for date: ${formattedSelectedDate}`);

        // Reset the date's data before updating
        dataToUpdate[formattedSelectedDate] = [];

        // Fetch all hours currently selected in the UI for this date.
        const selectedHours = $(`.checkbox-container[data-id='${containerId}'] .checkbox-hour:checked`)
            .map(function() { return parseInt($(this).val().split(':')[0], 10); })
            .get()
            .sort((a, b) => a - b);

        // Re-add selected hours, adjusting for added hours before the first and after the last selection.
        selectedHours.forEach(hour => {
            addTimeRange(hour, formattedSelectedDate, dataToUpdate);
        });

        if (selectedHours.length > 0) {
            const firstHour = selectedHours[0];
            const lastHour = selectedHours[selectedHours.length - 1];
            addTimeRange(firstHour - 1, formattedSelectedDate, dataToUpdate);
            addTimeRange(lastHour + 1, formattedSelectedDate, dataToUpdate);
        }

        console.log(`Updated data for ${containerId}:`, dataToUpdate[formattedSelectedDate]);
        mergeDataAndUpdateInput();
    }

function removeTransitionalHours(dateStr, data) {
    // Remove 23h from the previous day and 0h from the next day if they exist as orphaned entries.
    const previousDayStr = adjustDateStr(dateStr, -1);
    const nextDayStr = adjustDateStr(dateStr, 1);
    removeTimeRange(23, previousDayStr, data, true); // Force removal without checking
    removeTimeRange(0, nextDayStr, data, true); // Force removal without checking
}

    
    function updateAdditionalHours(currentlySelectedHoursSet, dateStr, data) {
        if (currentlySelectedHoursSet.size > 0) {
            const sortedHours = [...currentlySelectedHoursSet].sort((a, b) => a - b);
            const firstHour = sortedHours[0];
            const lastHour = sortedHours[sortedHours.length - 1];
    
            // Correctly adjust to add or remove additional hours based on the current selection
            addTimeRange(firstHour - 1, dateStr, data);
            addTimeRange(lastHour + 1, dateStr, data);
        }
    }
    
    
    function updateDateFullDisabled() {
        if (!dateFullDisabledInput) {
            console.error('dateFullDisabledInput is not defined.');

            return;
            
        }
    
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
    
    function updateHourSelection(data, dateStr, add = true) {
        // This function's usage has been streamlined in updateFirstDateInput
    }
    
    function addTimeRange(hour, dateStr, data) {
        let newDateStr = dateStr;
        if (hour < 0) {
            newDateStr = adjustDateStr(dateStr, -1); // Correctly adjust to the previous day
            hour = 23;
        } else if (hour > 23) {
            newDateStr = adjustDateStr(dateStr, 1); // Correctly adjust to the next day
            hour = 0;
        }
        const range = hourToRangeString(hour);
        if (!data[newDateStr]) data[newDateStr] = [];
        if (!data[newDateStr].includes(range)) {
            data[newDateStr].push(range);
        }
    }
    
    function removeTimeRange(hour, dateStr, data) {
        let newDateStr = dateStr;
        if (hour < 0) {
            newDateStr = adjustDateStr(dateStr, -1); // Adjust for previous day
            hour = 23;
        } else if (hour > 23) {
            newDateStr = adjustDateStr(dateStr, 1); // Adjust for next day
            hour = 0;
        }
        const rangeToRemove = hourToRangeString(hour);
        data[newDateStr] = (data[newDateStr] || []).filter(range => range !== rangeToRemove);
    }

    function adjustDateStr(dateStr, dayOffset) {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + dayOffset);
        return date.toISOString().split('T')[0];
    }
    
    
    
    
    function adjustDateForHour(hour, date) {
        if (hour < 0) {
            hour = 23;
            date.setDate(date.getDate() - 1);
        } else if (hour > 23) {
            hour = 0;
            date.setDate(date.getDate() + 1);
        }
        return date;
    }
    


    function removeRangeFromData(hour, date, data) {
        const targetFormattedDate = date.toLocaleDateString('fr-CA');
        const endHour = (hour + 1) % 24;
        const range = `${hour}h à ${endHour}h`;

        if (data[targetFormattedDate]) {
            const index = data[targetFormattedDate].indexOf(range);
            if (index !== -1) {
                data[targetFormattedDate].splice(index, 1);
            }
        }

        if (hour === 0) {
            removeRangeFromData(23, adjustDateForHour(-1, new Date(date)), data);
        } else if (hour === 23) {
            removeRangeFromData(0, adjustDateForHour(24, new Date(date)), data);
        }
    }

    function mergeDataAndUpdateInput() {
        let mergedData = {};
        // Merging logic
        console.log('Before merging:', {container1Data, container2Data});
        // Merge container1Data and container2Data into mergedData
        console.log('After merging:', mergedData);
        $('.firstdateinput').val(JSON.stringify(mergedData));
        console.log('Updated firstdateinput:', $('.firstdateinput').val());
        // Similarly update and log for dateFullDisabledInput
        console.log('Updated dateFullDisabledInput:', $('#datefulldisabled').val());
        const existingData = getExistingData();
        let allDates = new Set([...Object.keys(container1Data), ...Object.keys(container2Data), ...Object.keys(existingData)]);

        allDates.forEach(date => {
            let dataFromContainer1 = container1Data[date] || [];
            let dataFromContainer2 = container2Data[date] || [];
            let existingDataForDate = existingData[date] || [];

            mergedData[date] = [...new Set([...dataFromContainer1, ...dataFromContainer2, ...existingDataForDate])];
        });

        for (let date in mergedData) {
            if (mergedData[date].length === 0) {
                delete mergedData[date];
            }
        }

    $('.firstdateinput').val(JSON.stringify(mergedData));
    }

    function getExistingData() {
        const existingDataElement = document.querySelector('.paragraph-dhours');
        return existingDataElement ? parseJson(existingDataElement.textContent.trim()) : {};    }

        function parseJson(jsonString) {
            try { return JSON.parse(jsonString); }
            catch (error) { console.error("Error parsing JSON:", error); return null; }
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
                        const formattedSelectedDate = selectedDate.toLocaleDateString('fr-CA');
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
        
    });
