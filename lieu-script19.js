document.addEventListener('DOMContentLoaded', function () {
    const openingHourStr = $('#ouverture-lieu').text();
    const openingHour = parseInt(openingHourStr.split(/[:h]/)[0]);
    const closingHourStr = $('#fermeture-lieu').text();
    const closingHour = parseInt(closingHourStr.split(/[:h]/)[0]);

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
            mergeDataAndUpdateInput();
        }
    });

    const dateFullDisabledInput = document.querySelector('#datefulldisabled');

    document.addEventListener('change', function (event) {
        if ($(event.target).closest('.checkbox-container').length) {
            const selectedDates = dateInput.selectedDates;
            updateFirstDateInput(selectedDates, $(event.target).closest('.checkbox-container').data('id'));
            updateDateFullDisabled(selectedDates);
        }
    });

    function handleTimeSlot(hour, formattedSelectedDate, dataToUpdate, selectedDate, currentlySelectedHours, previouslySelectedHours) {
        const isSelected = currentlySelectedHours.has(hour);
        const wasSelected = previouslySelectedHours.has(hour);

        if (isSelected && !wasSelected) {
            addTimeRange(hour, formattedSelectedDate, dataToUpdate, selectedDate);
            if (hour !== openingHour) {
                addTimeRange(hour - 1, formattedSelectedDate, dataToUpdate, selectedDate);
            }
        } else if (!isSelected && wasSelected) {
            removeTimeRange(hour, formattedSelectedDate, dataToUpdate, selectedDate);
            if (hour !== openingHour) {
                removeTimeRange(hour - 1, formattedSelectedDate, dataToUpdate, selectedDate);
            }
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
        checkboxContainer.find('.checkbox-hour:checked').each(function () {
            const hour = parseInt(this.value.split(':')[0]);
            currentlySelectedHours.add(hour);
        });

        for (let hour = 0; hour < 24; hour++) {
            handleTimeSlot(hour, formattedSelectedDate, dataToUpdate, selectedDate, currentlySelectedHours, previouslySelectedHours);
        }

        mergeDataAndUpdateInput();
    }

    function updateDateFullDisabled(selectedDates) {
        const updatedData = {};
        selectedDates.forEach(selectedDate => {
            const formattedSelectedDate = selectedDate.toLocaleDateString('fr-CA');
            const checkboxContainer = $(`.checkbox-container[data-id='container1'], .checkbox-container[data-id='container2']`);
            const selectedHours = new Set();

            checkboxContainer.find('.checkbox-hour:checked').each(function () {
                const hour = parseInt(this.value.split(':')[0]);
                selectedHours.add(hour);
            });

            selectedHours.forEach(hour => {
                if (hour === 0) {
                    addTimeRange(23, formattedSelectedDate, updatedData, selectedDate, true);
                } else if (!selectedHours.has(hour - 1)) {
                    addTimeRange(hour - 1, formattedSelectedDate, updatedData, selectedDate);
                }

                addTimeRange(hour, formattedSelectedDate, updatedData, selectedDate);

                if (hour === 23) {
                    addTimeRange(0, formattedSelectedDate, updatedData, selectedDate, false, true);
                } else if (!selectedHours.has(hour + 1)) {
                    addTimeRange(hour + 1, formattedSelectedDate, updatedData, selectedDate);
                }
            });
        });

        dateFullDisabledInput.value = JSON.stringify(updatedData);
    }

    function addTimeRange(hour, date, data, selectedDate, isPrevDay = false, isNextDay = false) {
        const targetDate = new Date(selectedDate);
        if (isPrevDay) {
            targetDate.setDate(targetDate.getDate() - 1);
        } else if (isNextDay) {
            targetDate.setDate(targetDate.getDate() + 1);
        }
        const targetFormattedDate = targetDate.toLocaleDateString('fr-CA');
        const endHour = (hour + 1) % 24;
        const range = `${hour}h à ${endHour}h`;
        if (!data[targetFormattedDate]) {
            data[targetFormattedDate] = [];
        }
        if (!data[targetFormattedDate].includes(range)) {
            data[targetFormattedDate].push(range);
        }
    }

    function removeTimeRange(hour, date, data, selectedDate, isPrevDay = false, isNextDay = false) {
        let targetDate = new Date(selectedDate);
        targetDate = adjustDateForHour(hour, targetDate);
        removeRangeFromData(hour, targetDate, data);

        if (hour === 0) {
            let prevDate = new Date(selectedDate);
            prevDate.setDate(prevDate.getDate() - 1);
            removeRangeFromData(23, prevDate, data);
        } else if (hour === 23) {
            let nextDate = new Date(selectedDate);
            nextDate.setDate(nextDate.getDate() + 1);
            removeRangeFromData(0, nextDate, data);
        }
    }

    function removeRangeFromData(hour, date, data) {
        const formattedDate = date.toLocaleDateString('fr-CA');
        const endHour = (hour + 1) % 24;
        const range = `${hour}h à ${endHour}h`;
        if (data[formattedDate]) {
            const index = data[formattedDate].indexOf(range);
            if (index !== -1) {
                data[formattedDate].splice(index, 1);
                if (data[formattedDate].length === 0) {
                    delete data[formattedDate];
                }
            }
        }
    }

    function adjustDateForHour(hour, date) {
        const newDate = new Date(date);
        newDate.setHours(hour, 0, 0, 0);
        return newDate;
    }

    function mergeDataAndUpdateInput() {
        const mergedData = { ...container1Data, ...container2Data };
        dateFullDisabledInput.value = JSON.stringify(mergedData);
    }

    function updateCheckboxOptions(selectedDates, containerId) {
        let dataToUpdate = containerId === 'container1' ? container1Data : container2Data;
        const dateIndex = containerId === 'container1' ? 0 : 1;
        const selectedDate = selectedDates[dateIndex];
        if (!selectedDate) return;

        const formattedSelectedDate = selectedDate.toLocaleDateString('fr-CA');
        const checkboxContainer = $(`.checkbox-container[data-id='${containerId}']`);
        const selectedHours = new Set();

        checkboxContainer.find('.checkbox-hour:checked').each(function () {
            const hour = parseInt(this.value.split(':')[0]);
            selectedHours.add(hour);
        });

        for (let hour = openingHour; hour < closingHour; hour++) {
            const formattedHour = `${hour.toString().padStart(2, '0')}:00`;
            const checkbox = $(`<input type="checkbox" class="checkbox-hour" value="${formattedHour}" />`);
            const label = $(`<label>${formattedHour}</label>`);
            if (selectedHours.has(hour)) {
                checkbox.prop('checked', true);
            }
            checkboxContainer.append(checkbox);
            checkboxContainer.append(label);
        }

        if (dataToUpdate[formattedSelectedDate]) {
            dataToUpdate[formattedSelectedDate].forEach(range => {
                const [startHour] = range.split('h');
                const formattedHour = `${startHour.toString().padStart(2, '0')}:00`;
                checkboxContainer.find(`.checkbox-hour[value="${formattedHour}"]`).prop('checked', true);
            });
        }
    }

    function updateMoreDaysButton(selectedDates) {
        const moreDaysButton = $('#more-days-button');
        if (selectedDates.length === 1) {
            moreDaysButton.show();
        } else {
            moreDaysButton.hide();
        }
    }

    function formatDate(date) {
        return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
});
