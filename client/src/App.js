import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MealOrderSystem from './components/HomePage';
import OrderMetrics from './components/Analytics';

const App = () => {
	return (
		<Router>
			<Routes>
				{/* Home page route */}
				<Route path="/" element={<MealOrderSystem />} />

				{/* Analytics page route */}
				<Route path="/analytics" element={<OrderMetrics />} />

				{/* Fallback route for 404 */}
				{/* <Route path="*" element={<NotFoundPage />} /> */}
			</Routes>
		</Router>
	);
};

export default App;
