import React from 'react'
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import CurrencyConverter from './pages/CurrencyConverter'
import ProtectedRoute from './components/ProtectedRoute'
import SortIncome from "./pages/SortIncome"
import SortedIncomeList from "./pages/SortedIncomeList"
import SortedIncomeDetail from "./pages/SortedIncomeDetail"

 
function Logout(){
  localStorage.clear()
  return <Navigate to="/login"/>
}

function RegisterAndLogout(){
  localStorage.clear()
  return<Register/>
}

function App() {
  return (
    <BrowserRouter> 
      <Routes>
        <Route path= "/" element={
          <ProtectedRoute>
            <Home/>
          </ProtectedRoute>
        }
        /> 
        <Route path="/sort-income" element={
          <ProtectedRoute>
            <SortIncome />
          </ProtectedRoute>} />
        <Route path="/sorted-incomes" element={
          <ProtectedRoute>
            <SortedIncomeList />
          </ProtectedRoute>} />
        <Route path="/sorted-income/:id" element={
          <ProtectedRoute>
            <SortedIncomeDetail />
          </ProtectedRoute>} />
        <Route path='/currency-converter' element={
          <ProtectedRoute>
            <CurrencyConverter/>
          </ProtectedRoute>
        }
        />
        <Route path='/login' element={<Login />}/>
        <Route path='/logout' element={<Logout />}/>
        <Route path='/register' element={<RegisterAndLogout  />}/>
        <Route path='*' element={<NotFound />}/>
      </Routes>
    </BrowserRouter>
)
 }

export default App