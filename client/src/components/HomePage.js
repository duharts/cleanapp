import React, { useRef, useEffect, useState } from 'react';
import SignaturePad from 'signature_pad';
import { Clock, Pen, User, Plus, Minus } from 'lucide-react';
import AWS from 'aws-sdk';
import axios from 'axios'
import './AnalyticsPage.css';

const SignaturePadComponent = ({ setSignature, clear }) => {
    const canvasRef = useRef(null);
    const signaturePadRef = useRef(null);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            signaturePadRef.current = new SignaturePad(canvas, {
                backgroundColor: 'rgba(255, 255, 255, 0)',
                penColor: 'black',
            });

            const resizeCanvas = () => {
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                canvas.width = canvas.offsetWidth * ratio;
                canvas.height = canvas.offsetHeight * ratio;
                canvas.getContext('2d').scale(ratio, ratio);
            };

            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            return () => window.removeEventListener('resize', resizeCanvas);
        }
    }, []);

    useEffect(() => {
        if (clear && signaturePadRef.current) {
            signaturePadRef.current.clear();
        }
    }, [clear]);

    const handleSignatureEnd = () => {
        if (signaturePadRef.current) {
            setSignature(signaturePadRef.current.toDataURL());
        }
    };

    return (
        <canvas
            ref={canvasRef}
            style={{ border: '1px solid #000', borderRadius: '5px', width: '100%', height: '150px' }}
            onMouseUp={handleSignatureEnd}
            onTouchEnd={handleSignatureEnd}
        />
    );
};

function MealOrderSystem() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [roomNumber, setRoomNumber] = useState('');
    const [currentMeal, setCurrentMeal] = useState('');
    const [mealCount, setMealCount] = useState(0);
    const [signature, setSignature] = useState(null);
    const [clearSignature, setClearSignature] = useState(false);

    const translations = {
        mealOrder: "Meal Order System",
        roomNumber: "Room Number",
        breakfast: "Breakfast",
        lunch: "Lunch",
        dinner: "Dinner",
        closed: "Kitchen Closed",
        currentMeal: "Current Meal Order",
        signature: "Signature",
        signHere: "Sign here",
        clearSignature: "Clear Signature",
        submitOrder: "Submit Order",
        clear: "Clear",
        delete: "Delete",
        selectMeals: "Select Meals",
        totalMeals: "Total",
        noMeals: "No Meals Available at This Time",
        firstName: "First Name",
        lastName: "Last Name",
        guestInfo: "Guest Information"
    };

    const t = translations;

    useEffect(() => {
        const getCurrentMeal = () => {
            const hour = new Date().getHours();
            if (hour >= 2 && hour < 11) return 'breakfast';
            if (hour >= 11 && hour < 16) return 'lunch';
            if (hour >= 16 && hour < 22) return 'dinner';
            return 'closed';
        };

        setCurrentMeal(getCurrentMeal());
        const interval = setInterval(() => {
            setCurrentMeal(getCurrentMeal());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const handleNumberInput = (num) => {
        if (roomNumber.length < 4) {
            setRoomNumber(prev => prev + num);
        }
    };

    const handleClearRoomNumber = () => {
        setRoomNumber('');
    };

    const handleDeleteLastDigit = () => {
        setRoomNumber(prev => prev.slice(0, -1));
    };

    const handleClearSignature = () => {
        setClearSignature(true);
        setSignature(null);
        setTimeout(() => setClearSignature(false), 0);
    };

    const submitOrder = async () => {
        const orderData = {
            firstName,
            lastName,
            roomNumber,
            meal: currentMeal,
            mealCount,
            signatureUrl: signature,
            // signS3url: 'testing url',
            created_at: new Date().toISOString()
        };

        console.log(orderData)
        const response = await axios.post('http://localhost:5000/api/submit-order', {
            data: orderData
        }).then((res) => {
            console.log('Order submitted -> ', res)
            alert(res.data.message);
            setFirstName('')
            setLastName('')
            setRoomNumber('')
            handleClearSignature()
            setMealCount(0)

        }).catch((err) => {
            console.log('Error Submitting order -> ', err)
            // alert(err.data.error);
        })


    };





    // console.log(firstName, lastName, roomNumber, currentMeal, signature)
    return (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center space-x-2">
                        <Clock className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-semibold text-gray-800">{t.mealOrder}</h2>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                        {currentMeal === 'breakfast' && `☀️ ${t.breakfast}`}
                        {currentMeal === 'lunch' && `🌞 ${t.lunch}`}
                        {currentMeal === 'dinner' && `🌙 ${t.dinner}`}
                        {currentMeal === 'closed' && `🌜 ${t.closed}`}
                    </div>
                </div>

                {/* Guest Information */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-gray-800">
                        <User className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-medium">{t.guestInfo}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-600">
                                {t.firstName}
                            </label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                placeholder="John"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-600">
                                {t.lastName}
                            </label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                placeholder="Doe"
                            />
                        </div>
                    </div>
                </div>

                {/* Room Number */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-600">{t.roomNumber}</label>
                    <div className="text-2xl font-mono bg-white border rounded-lg p-3 text-center">
                        {roomNumber || '----'}
                    </div>
                </div>

                {/* Number Pad for Room Number */}
                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberInput(num)}
                            className="bg-white border rounded-lg p-4 text-xl font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={handleClearRoomNumber}
                        className="bg-gray-100 border rounded-lg p-4 text-sm font-semibold hover:bg-gray-200 active:bg-gray-300 transition-colors"
                    >
                        {t.clear}
                    </button>
                    <button
                        onClick={() => handleNumberInput(0)}
                        className="bg-white border rounded-lg p-4 text-xl font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDeleteLastDigit}
                        className="bg-gray-100 border rounded-lg p-4 text-sm font-semibold hover:bg-gray-200 active:bg-gray-300 transition-colors"
                    >
                        {t.delete}
                    </button>
                </div>

                {/* Meal Selection */}
                <div className="space-y-3">
                    {currentMeal === 'closed' ? (
                        <div className="bg-gray-50 p-6 rounded-lg text-center">
                            <div className="text-gray-500 text-lg font-medium">
                                <span className="block text-2xl mb-2">🌜</span>
                                {t.noMeals}
                            </div>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-lg font-medium text-gray-700 flex items-center space-x-2">
                                <span>{t.selectMeals}</span>
                                {mealCount > 0 && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                        {mealCount} {t.totalMeals}
                                    </span>
                                )}
                            </h3>
                            <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
                                <div className="flex items-center space-x-3">
                                    <span className="text-xl">
                                        {currentMeal === 'breakfast' ? '☀️' :
                                            currentMeal === 'lunch' ? '🌞' : '🌙'}
                                    </span>
                                    <span className="font-medium text-gray-700">{t[currentMeal]}</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => setMealCount(prev => Math.max(0, prev - 1))}
                                        disabled={mealCount === 0}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        <Minus className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <span className="w-8 text-center font-semibold text-lg">{mealCount}</span>
                                    <button
                                        onClick={() => setMealCount(prev => prev + 1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100"
                                    >
                                        <Plus className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Signature Pad */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Pen className="w-4 h-4 text-gray-600" />
                            <h3 className="text-lg font-medium text-gray-700">{t.signature}</h3>
                        </div>
                        <button
                            onClick={handleClearSignature}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            {t.clearSignature}
                        </button>
                    </div>
                    <SignaturePadComponent
                        setSignature={setSignature}
                        clear={clearSignature}
                    />
                </div>

                {/* Submit Button */}
                <button
                    onClick={submitOrder}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50"
                    disabled={!firstName || !lastName || !roomNumber || !signature}
                >
                    {t.submitOrder}
                </button>
            </div>
        </div>
    );
}

export default MealOrderSystem;