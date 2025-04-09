"use client"

// components/CalendarWidget.jsx
import React, { useState } from 'react';
import { format, addMonths, addDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, getDay, getDate, getMonth, getYear, isSameMonth, isSameDay, isBefore, startOfDay } from 'date-fns';

// Helper function to generate placeholder time slots
const generateTimeSlots = (date) => {
    // In a real app, fetch this based on the coach's availability for 'date'
    if (getDay(date) % 2 !== 0) { // Example: only available on odd days of the week (Sun=0, Mon=1, etc.)
        return ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"];
    }
    return [];
};

// Helper to check if a day is considered "available" (placeholder logic)
const isDayAvailable = (date) => {
    // Replace with actual logic checking fetched availability data
    return generateTimeSlots(date).length > 0;
};


export default function CalendarWidget() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const today = startOfDay(new Date()); // Use startOfDay to compare dates consistently
    const currentWeekStart = startOfWeek(today); // Get the start of the current week (Sunday by default in date-fns)

    const nextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
        setSelectedDate(null); // Clear selection when changing month
    };

    const prevMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
        setSelectedDate(null); // Clear selection when changing month
    };

    const handleDateClick = (day) => {
        // Disable clicking days before the current week starts
        if (isBefore(day, currentWeekStart)) {
            return;
        }
        // Disable clicking days that aren't available (based on placeholder logic)
        if (!isDayAvailable(day)) {
            return;
        }
        setSelectedDate(day);
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-between items-center mb-4 px-2">
                <button onClick={prevMonth} className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100">&lt;</button>
                <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
                <button onClick={nextMonth} className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100">&gt;</button>
            </div>
        );
    };

    const renderDaysOfWeek = () => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return (
            <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500 mb-2">
                {days.map(day => <div key={day}>{day}</div>)}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, 'd');
                const cloneDay = day; // Important for closure in onClick
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isPast = isBefore(day, today); // Check if day is before today
                const isToday = isSameDay(day, today);
                const isAvailable = isCurrentMonth && !isPast && isDayAvailable(cloneDay);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                days.push(
                    <div
                        key={day.toString()}
                        className={`p-2 h-10 flex items-center justify-center border border-transparent ${
                            !isCurrentMonth ? 'text-gray-300' : ''
                        } ${
                            isPast && isCurrentMonth ? 'text-gray-400 cursor-not-allowed' : '' // Style past days
                        } ${
                            !isPast && isCurrentMonth && !isAvailable && !isToday ? 'text-gray-500' : '' // Style unavailable future days
                        } ${
                            isToday ? 'bg-blue-100 border-blue-300 rounded font-medium text-blue-700' : ''
                        } ${
                            isAvailable ? 'cursor-pointer hover:bg-blue-100 hover:border-blue-300 rounded' : ''
                        } ${
                             isAvailable && !isSelected ? 'font-medium text-blue-700' : '' // Highlight available days
                        } ${
                            isSelected ? 'bg-blue-500 text-white rounded font-bold' : ''
                        }`}
                        onClick={() => isCurrentMonth && !isPast && handleDateClick(cloneDay)}
                    >   
                        {isToday && <span className='absolute -mt-7 text-[10px]'>Today</span>}
                        <span>{formattedDate}</span>
                    </div>
                );
                day = addDays(day, 1); // Use date-fns addDays
            }
            rows.push(
                <div className="grid grid-cols-7 gap-1" key={day.toString() + "_row"}>
                    {days}
                </div>
            );
            days = []; // Reset days for the next row
        }
        return <div>{rows}</div>;
    };

    const renderTimeSlots = () => {
        if (!selectedDate) {
            return <div className="mt-6 text-center text-gray-500">Select an available date to see time slots.</div>;
        }

        const slots = generateTimeSlots(selectedDate); // Use placeholder generator

        if (slots.length === 0) {
             return <div className="mt-6 text-center text-gray-500">No available slots for {format(selectedDate, 'MMMM d')}.</div>;
        }

        return (
            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3 text-center">Available Times for {format(selectedDate, 'MMMM d')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {slots.map(slot => (
                        <button
                            key={slot}
                            className="p-2 border border-gray-300 rounded text-center text-blue-600 hover:bg-blue-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            // Add onClick handler later to proceed with booking this slot
                        >
                            {slot}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col md:flex-row gap-8 p-4 max-w-3xl mx-auto bg-white shadow rounded-lg">
            {/* Calendar */}
            <div className="flex-1">
                {renderHeader()}
                {renderDaysOfWeek()}
                {renderCells()}
            </div>

            {/* Time Slots */}
            <div className="flex-1 md:border-l md:pl-8">
                {renderTimeSlots()}
            </div>
        </div>
    );
}