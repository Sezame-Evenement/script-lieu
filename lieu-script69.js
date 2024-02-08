document.addEventListener("DOMContentLoaded", function () {
    let container1Data = {};
    let container2Data = {};
    let initialSelectedDate, secondContainerVisible = false;

    const dateFullDisabledInput = document.querySelector('#datefulldisabled');


    // Initialize flatpickr for date selection
    const today = new Date(), tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = flatpickr("#date", {
        altInput: true, altFormat: "d/m/y", locale: "fr", enableTime: false, minDate: today,
        disable: [function (date) {
            return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        }],
        onChange: function (selectedDates) {
            console.log("Date selection changed", selectedDates);
            initialSelectedDate = selectedDates.length > 0 ? selectedDates[0] : null;
            handleDateChange(selectedDates);
        }
    });

    function handleDateChange(selectedDates) {
        updateDateHeadings(selectedDates);
        resetSelections();
        toggleSecondContainerVisibility(selectedDates);
        processSelections();
    }

    // Updates the date headings based on selected dates
    function updateDateHeadings(selectedDates) {
        if (selectedDates.length > 0) {
            $(".date-heading").eq(0).text(formatDate(selectedDates[0]));
            updateCheckboxOptions(selectedDates, "container1");
            updateMoreDaysButton(selectedDates);
        }
    }

    // Toggles the visibility of the second container based on the number of selected dates
    function toggleSecondContainerVisibility(selectedDates) {
        if (selectedDates.length > 1) {
            const secondDate = selectedDates[1];
            secondContainerVisible = true;
            showSecondContainer(secondDate);
        } else {
            secondContainerVisible = false;
            hideSecondContainer();
        }
    }

    // Show the second container and update its options
    function showSecondContainer(secondDate) {
        $(".checkbox-container[data-id='container2']").html($(".checkbox-container[data-id='container1']").html());
        updateCheckboxOptions([secondDate], "container2");
        $(".date-heading").eq(1).text(formatDate(secondDate)).show();
        $(".checkbox-container[data-id='container2']").show();
    }

    // Hide the second container
    function hideSecondContainer() {
        $(".checkbox-container").eq(1).hide();
        $(".date-heading").eq(1).hide();
    }


  
    


    $('.moredays').click(function() {
        secondContainerVisible = !secondContainerVisible;
        console.log("More days button clicked, second container visibility: ", secondContainerVisible);
        if (secondContainerVisible) {
            const secondDate = new Date(initialSelectedDate);
            secondDate.setDate(secondDate.getDate() + 1);
            showSecondContainer(secondDate);
        } else {
            hideSecondContainer();
        }
    });

  
    function resetSelections() {
        console.log("Resetting selections");
        container1Data = {};
        container2Data = {};
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
        if (initialSelectedDate) {
            processContainerSelections('container1', formatDate(initialSelectedDate));
            if (secondContainerVisible) {
                const nextDay = new Date(initialSelectedDate);
                nextDay.setDate(nextDay.getDate() + 1);
                processContainerSelections('container2', formatDate(nextDay));
            }
        }
        mergeDataAndUpdateInput(); // Combine data from both containers
    }
    
    function processContainerSelections(containerId, dateStr) {
        console.log(`Processing selections for ${containerId} on ${dateStr}`);
        let selectedHours = getSelectedHours(containerId);
        console.log(`Selected hours in ${containerId}:`, selectedHours);
        adjustSelectionsForDayTransition(selectedHours, dateStr, containerId);
        updateContainerData(containerId, dateStr, selectedHours);
    }
    
    
    function getSelectedHours(containerId) {
        let selectedHours = $(`.checkbox-container[data-id='${containerId}'] .checkbox-hour:checked`).map(function() {
            return parseInt($(this).val().split(':')[0], 10);
        }).get();
        console.log(`Selected hours in ${containerId}:`, selectedHours);
        return selectedHours.sort((a, b) => a - b);
    }

    function adjustSelectionsForDayTransition(selectedHours, dateStr, containerId) {
        console.log(`Adjusting day transition for ${containerId} with hours:`, selectedHours, `on date: ${dateStr}`);

        // Logic to add one hour before the first and after the last hour, considering day transition
        if (selectedHours.length > 0) {
            const firstHour = selectedHours[0];
            const lastHour = selectedHours[selectedHours.length - 1];
            addTimeRange(firstHour - 1, dateStr, containerId); // Adjust for previous day if hour is 0
            addTimeRange(lastHour + 1, dateStr, containerId); // Adjust for next day if hour is 23
        }
    }
    
    
    function updateContainerData(containerId, dateStr, selectedHours) {
        console.log(`Updating data for ${containerId} on ${dateStr} with selected hours:`, selectedHours);
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
    }
    
    // This function encapsulates the logic for merging data and updating the input
    function mergeDataAndUpdateInput() {
        console.log("Merging data from both containers");

        let mergedData = {};
    
        // Combine data from both containers
        Object.keys(container1Data).forEach(date => {
            mergedData[date] = [...(mergedData[date] || []), ...(container1Data[date] || [])];
        });
        Object.keys(container2Data).forEach(date => {
            mergedData[date] = [...(mergedData[date] || []), ...(container2Data[date] || [])];
        });
    
        // Convert mergedData to the correct format for firstdateinput
        $('.firstdateinput').val(JSON.stringify(mergedData));
    }
    
    document.addEventListener('change', function(event) {
        if ($(event.target).closest('.checkbox-container').length) {
            console.log("Change detected in container: ", $(event.target).closest('.checkbox-container').data('id'));
            const selectedDates = dateInput.selectedDates;
            updateFirstDateInput(selectedDates, $(event.target).closest('.checkbox-container').data('id'));
            updateDateFullDisabled(selectedDates);
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

    $('.checkbox-container').on('change', '.checkbox-hour', function() {
        const containerId = $(this).closest('.checkbox-container').data('id');
        console.log(`Checkbox change detected in ${containerId}`);
        const selectedDates = dateInput.selectedDates;
        updateFirstDateInput(selectedDates, containerId);
    });
    


    function updateFirstDateInput(selectedDates, containerId) {
        console.log(`Updating first date input for ${containerId}`);
    
        let dateIndex = containerId === 'container1' ? 0 : (selectedDates.length > 1 ? 1 : 0);
        let selectedDate = selectedDates[dateIndex];
    
        // Generate the correct key for accessing and storing date-specific data
        let key = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;
    
        let dataToUpdate = containerId === 'container1' ? container1Data : container2Data;
    
        // Initialize data structure for the key if it doesn't exist
        if (!dataToUpdate[key]) {
            dataToUpdate[key] = [];
        }
    
        const selectedHours = $(`.checkbox-container[data-id='${containerId}'] .checkbox-hour:checked`)
            .map(function() {
                return $(this).val(); // Using the value attribute directly, which should be in the correct format
            })
            .get();
    
        // Correct hour range formatting and handling transitions
        selectedHours.forEach(hour => {
            if (!dataToUpdate[key].includes(hour)) {
                dataToUpdate[key].push(hour);
            }
        });
    
        // Handling the addition of one hour before the first and one hour after the last hour, with proper transition between days
        handleHourTransitions(selectedHours, key, dataToUpdate);
    
        console.log(`Data to update after handling ${containerId}:`, dataToUpdate);
    
        mergeDataAndUpdateInput();
    }
    
    

    function handleHourTransitions(selectedHours, key, dataToUpdate) {
        if (selectedHours.length > 0) {
            let firstHour = parseInt(selectedHours[0].split('h')[0]);
            let lastHour = parseInt(selectedHours[selectedHours.length - 1].split('h à ')[1]);
    
            // Add hour before first if it's not the very start of the day
            if (firstHour > 0) {
                let prevHour = `${firstHour - 1}h à ${firstHour}h`;
                dataToUpdate[key] = [prevHour, ...dataToUpdate[key]];
            } else {
                // Handle transition from 0h to the previous day
                let prevDayKey = adjustDateStr(key, -1);
                dataToUpdate[prevDayKey] = [...(dataToUpdate[prevDayKey] || []), "23h à 0h"];
            }
    
            // Add hour after last if it's not the very end of the day
            if (lastHour < 24) {
                let nextHour = `${lastHour}h à ${lastHour + 1}h`;
                dataToUpdate[key].push(nextHour);
            } else {
                // Handle transition from 23h to the next day
                let nextDayKey = adjustDateStr(key, 1);
                dataToUpdate[nextDayKey] = ["0h à 1h", ...(dataToUpdate[nextDayKey] || [])];
            }
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
        // Adjust for 24-hour format and correct string format
        let startHour = hour.toString().padStart(2, '0');
        let endHour = ((hour + 1) % 24).toString().padStart(2, '0');
        return `${startHour}h à ${endHour === '00' ? endHour : endHour + 'h'}`; // Adjusting the end hour format
    }
    
    function updateHourSelection(data, dateStr, add = true) {
        // This function's usage has been streamlined in updateFirstDateInput
    }
    
    function addTimeRange(hour, key, dataToUpdate) {
        // Correctly add time range considering day transition
        if (hour === 23) {
            let nextDayKey = adjustDateStr(key, 1);
            dataToUpdate[nextDayKey] = dataToUpdate[nextDayKey] || [];
            dataToUpdate[nextDayKey].push("0h à 1h");
        } else if (hour === 0) {
            let prevDayKey = adjustDateStr(key, -1);
            dataToUpdate[prevDayKey] = dataToUpdate[prevDayKey] || [];
            dataToUpdate[prevDayKey].push("23h à 0h");
        } else {
            // Normal hour range addition
            let hourRange = `${hour}h à ${(hour + 1) % 24}h`;
            dataToUpdate[key] = dataToUpdate[key] || [];
            if (!dataToUpdate[key].includes(hourRange)) {
                dataToUpdate[key].push(hourRange);
            }
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

    function adjustDateStr(dateStr, days) {
        let parts = dateStr.split('-');
        let adjustedDate = new Date(parts[0], parts[1] - 1, parseInt(parts[2]) + days);
        return `${adjustedDate.getFullYear()}-${(adjustedDate.getMonth() + 1).toString().padStart(2, '0')}-${adjustedDate.getDate().toString().padStart(2, '0')}`;
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
