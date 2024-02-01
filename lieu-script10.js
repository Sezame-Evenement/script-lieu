document.addEventListener("DOMContentLoaded", function() {
    let container1Data = {};
    let container2Data = {};
    let initialSelectedDate, secondContainerVisible = false;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = flatpickr("#date", {
        altInput: true,
        altFormat: "d/m/y",
        locale: "fr",
        enableTime: false,
        minDate: today,
        disable: [
            function(date) {
                return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
            }
        ],
        onChange: function(selectedDates) {
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
            mergeDataAndUpdateInput();
        }
    });

    const dateFullDisabledInput = document.querySelector('#datefulldisabled');

    document.addEventListener('change', function(event) {
        if ($(event.target).closest('.checkbox-container').length) {
            const selectedDates = dateInput.selectedDates;
            updateFirstDateInput(selectedDates, $(event.target).closest('.checkbox-container').data('id'));
            updateDateFullDisabled(selectedDates, event.target);
        }
    });

    function updateDateFullDisabled(selectedDates, target) {
        const updatedData = {};
        let datesToProcess = [];
    
        if ($(target).closest('.checkbox-container').data('id') === 'container1') {
            datesToProcess = selectedDates.slice(0, 1);
        } else if ($(target).closest('.checkbox-container').data('id') === 'container2') {
            datesToProcess = selectedDates.length > 1 ? [selectedDates[1]] : [];
        } else {
            datesToProcess = selectedDates;
        }
    
        datesToProcess.forEach(selectedDate => {
            const formattedSelectedDate = selectedDate.toLocaleDateString('fr-CA');
            const checkboxContainer = $(`.checkbox-container[data-id='${$(target).closest('.checkbox-container').data('id')}']`);
            const selectedHours = new Set();
    
            checkboxContainer.find('.checkbox-hour:checked').each(function() {
                const hour = parseInt(this.value.split(':')[0]);
                selectedHours.add(hour);
            });
    
            selectedHours.forEach(hour => {
                addTimeRange(hour - 1, formattedSelectedDate, updatedData, selectedDate);
                addTimeRange(hour, formattedSelectedDate, updatedData, selectedDate);
                addTimeRange(hour + 1, formattedSelectedDate, updatedData, selectedDate);
            });
        });
    
        dateFullDisabledInput.value = JSON.stringify(updatedData);
    }

    function updateFirstDateInput(selectedDates, containerId) {
        let dataToUpdate = containerId === 'container1' ? container1Data : container2Data;
        const dateIndex = containerId === 'container1' ? 0 : 1;
        const selectedDate = selectedDates[dateIndex];
        if (!selectedDate) return;
    
        const formattedSelectedDate = selectedDate.toLocaleDateString('fr-CA');
        const checkboxContainer = $(`.checkbox-container[data-id='${containerId}']`);
    
        const previouslySelectedHours = new Set();
        if (dataToUpdate[formattedSelectedDate]) {
            dataToUpdate[formattedSelectedDate].forEach(range => {
                const startHour = parseInt(range.split('h')[0]);
                previouslySelectedHours.add(startHour);
            });
        }
    
        const currentlySelectedHours = new Set();
        checkboxContainer.find('.checkbox-hour:checked').each(function() {
            const hour = parseInt(this.value.split(':')[0]);
            currentlySelectedHours.add(hour);
        });
    
        for (let hour = 0; hour < 24; hour++) {
            handleTimeSlot(hour, formattedSelectedDate, dataToUpdate, selectedDate, currentlySelectedHours, previouslySelectedHours);
        }
    
        mergeDataAndUpdateInput();
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
        return existingDataElement ? parseJson(existingDataElement.textContent.trim()) : {};
    }
    
    function parseJson(jsonString) {
        try { return JSON.parse(jsonString); }
        catch (error) { console.error("Error parsing JSON:", error); return null; }
    }
    
    function formatDate(date) {
        return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    function handleTimeSlot(hour, date, data, selectedDate, currentlySelectedHours, previouslySelectedHours) {
        const isSelected = currentlySelectedHours.has(hour);
        const wasSelected = previouslySelectedHours.has(hour);
    
        if (isSelected && !wasSelected) {
            addTimeRange(hour, date, data, selectedDate);
            addTimeRange(hour - 1, date, data, selectedDate);
            addTimeRange(hour + 1, date, data, selectedDate);
        } else if (!isSelected && wasSelected) {
            removeTimeRange(hour, date, data, selectedDate);
            removeTimeRange(hour - 1, date, data, selectedDate);
            removeTimeRange(hour + 1, date, data, selectedDate);
        }
    }

    function updateFirstDateInput(selectedDates, containerId) {
        let dataToUpdate = containerId === 'container1' ? container1Data : container2Data;
        const dateIndex = containerId === 'container1' ? 0 : 1;
        const selectedDate = selectedDates[dateIndex];
        if (!selectedDate) return;
    
        const formattedSelectedDate = selectedDate.toLocaleDateString('fr-CA');
        const checkboxContainer = $(`.checkbox-container[data-id='${containerId}']`);
    
        const previouslySelectedHours = new Set();
        if (dataToUpdate[formattedSelectedDate]) {
            dataToUpdate[formattedSelectedDate].forEach(range => {
                const startHour = parseInt(range.split('h')[0]);
                previouslySelectedHours.add(startHour);
            });
        }
    
        const currentlySelectedHours = new Set();
        checkboxContainer.find('.checkbox-hour:checked').each(function() {
            const hour = parseInt(this.value.split(':')[0]);
            currentlySelectedHours.add(hour);
        });
    
        for (let hour = 0; hour < 24; hour++) {
            handleTimeSlot(hour, formattedSelectedDate, dataToUpdate, selectedDate, currentlySelectedHours, previouslySelectedHours);
        }
    
        mergeDataAndUpdateInput();
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
    
    
