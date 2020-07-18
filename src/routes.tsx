import React from 'react';
import { BrowserRouter, Route } from "react-router-dom";
import Home from './pages/Home';
import Point from './pages/Point';

const Routes = () => {
    return (
        <BrowserRouter>
            <Route component={Home} path="/" exact /> 
            <Route component={Point} path="/criar-ponto-coleta" /> 
        </BrowserRouter>
    );
}

export default Routes;