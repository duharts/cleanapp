import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const OrderMetrics = () => {
    const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // Default: last 7 days
    const [endDate, setEndDate] = useState(new Date());
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [limit, setLimit] = useState(10);
    const [offset, setOffset] = useState(0);

    const fetchOrders = async () => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/meal-analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=${limit}&offset=${offset}`
            );
            const data = await response.json();
            setOrders(data.orders);
            setTotal(data.total);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    useEffect(() => {
        fetchOrders(); // Fetch data on initial render and when dependencies change
    }, [startDate, endDate, limit, offset]);

    const handlePageChange = (newOffset) => {
        setOffset(newOffset);
    };

    return (
        <div className="analytics-container">
            <h1>Meal Analytics</h1>
            <div>
                <label>Start Date:</label>
                <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} />
            </div>
            <div>
                <label>End Date:</label>
                <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} />
            </div>
            <button className="fetch-button" onClick={fetchOrders}>Fetch Analytics</button>

            <table className="analytics-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Meal</th>
                        <th>Meal Count</th>
                        <th>Room Number</th>
                        <th>Created At</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.length === 0 ? (
                        <p>No records found</p>
                    ) : (orders.map((order, index) => (
                        <tr key={index}>
                            <td>{order.id}</td>
                            <td>{order.meal}</td>
                            <td>{order.mealCount}</td>
                            <td>{order.roomNumber}</td>
                            <td>{order.created_at}</td>
                        </tr>
                    )))}
                </tbody>
            </table>
        </div>
    );
};

export default OrderMetrics;
