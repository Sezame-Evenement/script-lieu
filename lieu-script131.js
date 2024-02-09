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
        // Ensure this also triggers reprocessing of selections if needed
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
        let selectedHours = getSelectedHours(containerId);
        console.log(`Processing selections for ${containerId} on ${dateStr}: Selected hours:`, selectedHours);

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
        // Logic to add one hour before the first and after the last hour, considering day transition
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
    
            // Handle adding transitional hours for 0 and 23 hours
            if (hour === 0) {
                let previousDay = adjustDateStr(dateStr, -1);
                addTimeRange(23, previousDay, containerId); // Adjust for the previous day
            } else if (hour === 23) {
                let nextDay = adjustDateStr(dateStr, 1);
                addTimeRange(0, nextDay, containerId); // Adjust for the next day
            }
        });
        console.log(`Updated ${containerId} data:`, dataToUpdate);

    }
    
    // This function encapsulates the logic for merging data and updating the input
    function mergeDataAndUpdateInput() {
        let mergedData = {};
    
        // Combine data from both containers
        Object.keys(container1Data).forEach(date => {
            mergedData[date] = [...(mergedData[date] || []), ...(container1Data[date] || [])];
        });
        Object.keys(container2Data).forEach(date => {
            mergedData[date] = [...(mergedData[date] || []), ...(container2Data[date] || [])];
        });
        console.log("Merged data:", mergedData);

        // Convert mergedData to the correct format for firstdateinput
        $('.firstdateinput').val(JSON.stringify(mergedData));
        console.log("Merged data for firstdateinput:", $('.firstdateinput').val());
        console.log("Updated dateFullDisabledInput value:", $('#datefulldisabled').val());
    }
    
    document.addEventListener('change', function(event) {
        if ($(event.target).closest('.checkbox-container').length) {
            console.log("Checkbox change detected in container: ", $(event.target).closest('.checkbox-container').data('id'));

            const selectedDates = dateInput.selectedDates;
            const containerId = $(event.target).closest('.checkbox-container').data('id');
            console.log(`Checkbox change detected in ${containerId}`);
            
            // Retrieve the date for the first container
            const firstContainerDate = selectedDates[0];
            
            // Calculate the date for the second container (next day)
            const secondContainerDate = new Date(firstContainerDate);
            secondContainerDate.setDate(secondContainerDate.getDate() + 1);
    
            console.log("First container date:", formatDate(firstContainerDate));
            console.log("Second container date:", formatDate(secondContainerDate));
            
            const checkboxValue = event.target.value;
            console.log("Selected checkbox value: ", checkboxValue);

            console.log("Container 2 data before updating:", container2Data);
            console.log("Selected checkbox value for container 2:", $(event.target).val());
            // Update the input for the first container
            updateFirstDateInput(selectedDates, containerId);
            
            // Update the disabled dates input
            updateDateFullDisabled(selectedDates);
            console.log("Updated Container 2 data:", container2Data);

        }
    });
    
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
        console.log("Updating first date input for container: ", containerId);

        let dataToUpdate = containerId === 'container1' ? container1Data : container2Data;
        const dateIndex = containerId === 'container1' ? 0 : 1;
        const selectedDate = selectedDates[dateIndex];
        if (!selectedDate) return;
    
        const formattedSelectedDate = selectedDate.toLocaleDateString('fr-CA');
        let currentSelections = dataToUpdate[formattedSelectedDate] || [];
    
        console.log(`Updating first date input for ${containerId}, selected date: ${formattedSelectedDate}`);
        console.log("First container date before updating firstdateinput:", formatDate(selectedDates[0]));
        // Update the console log to include the updated value of firstdateinput
        console.log("First date input value after updating:", $('.firstdateinput').val());
        
        // Clear selections for the date to handle deselection.
        dataToUpdate[formattedSelectedDate] = [];
    
        // Fetch all hours currently selected in the UI for this date.
        const selectedHours = $(`.checkbox-container[data-id='${containerId}'] .checkbox-hour:checked`)
            .map(function() { return parseInt($(this).val().split(':')[0], 10); })
            .get()
            .sort((a, b) => a - b);
    
        console.log(`Selected hours in ${containerId}:`, selectedHours);
    
        // Re-add selected hours, adjusting for added hours before the first and after the last selection.
        selectedHours.forEach(hour => addTimeRange(hour, formattedSelectedDate, dataToUpdate));
    
        // Add one hour before the first and after the last selection, if there are any selections.
        if (selectedHours.length > 0) {
            const firstHour = selectedHours[0];
            const lastHour = selectedHours[selectedHours.length - 1];
            addTimeRange(firstHour - 1, formattedSelectedDate, dataToUpdate);
            addTimeRange(lastHour + 1, formattedSelectedDate, dataToUpdate);
        } else {
            // If no hours are currently selected, ensure transitional hours are removed.
            removeTransitionalHours(formattedSelectedDate, dataToUpdate);
        }
    
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
        console.log("Updating dateFullDisabledInput");
        if (!dateFullDisabledInput) {
            console.error('dateFullDisabledInput is not defined.');
            return;
        }
    
        console.log("Container 1 data:", container1Data);
        console.log("Container 2 data:", container2Data);
    
        const updatedData = {};
        Object.keys(container1Data).concat(Object.keys(container2Data)).forEach(date => {
            const hours = [...(container1Data[date] || []), ...(container2Data[date] || [])];
            if (hours.length > 0) {
                updatedData[date] = hours;
            }
        });
    
        console.log("Updated data:", updatedData);
    
        dateFullDisabledInput.value = JSON.stringify(updatedData);
        console.log("DateFullDisabledInput before updating:", dateFullDisabledInput.value);
        // Add console log statements within the updateDateFullDisabled function to track its execution
        console.log("Updated dateFullDisabledInput value:", dateFullDisabledInput.value);
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
        const existingData = getExistingData();
        let allDates = new Set([...Object.keys(container1Data), ...Object.keys(container2Data), ...Object.keys(existingData)]);

        console.log("Container 1 data:", container1Data);
        console.log("Container 2 data:", container2Data);
    

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
            console.log(`Updating checkbox options for ${containerId} with selected dates:`, selectedDates.map(date => formatDate(date)));
        
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
