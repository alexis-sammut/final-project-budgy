import { useState, useEffect } from "react"
import api from "../api"
import "../styles/Home.css"

function Home(){
    const [pockets, setPockets] = useState([]);
    const [amount, setAmount] = useState("");
    const [name, setName] = useState("");
    const [showModal, setShowModal] = useState(false);

    useEffect(()=> {
        getPockets();
    }, [])

    const getPockets = () => {
        api
            .get("/api/pockets/")
            .then((res) => res.data)
            .then((data) => { setPockets(data); console.log(data)})
            .catch((err) => alert(err));
    }

    const deletePocket = (id) => {
        api.delete(`api/pockets/delete/${id}/`).then((res)=>{
            if (res.status === 204) alert('Pocket deleted!')
            else alert('Failed to delete pocket.')
            getPockets()   
        }).catch((error) => alert(error))
    };

    const createPocket = (e) => {  
        e.preventDefault()
        api.post('/api/pockets/', {amount, name}).then((res) => {
            if (res.status === 201) {
                alert('Pocket created!')
                setShowModal(false)
                setName("")
                setAmount("")
            }
            else alert('Failed to create pocket.')
            getPockets()
        }).catch((err) => alert(err));
    };

    // Array of vibrant colors for pockets
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
        '#F8B500', '#FF85A2', '#7FDBFF', '#2ECC71'
    ];

    return (
        <div className="home-container">
            <div className="header">
                <div className="header-content">
                    <h1>My Pockets</h1>
                    <button className="create-btn" onClick={() => setShowModal(true)}>
                        + Create Pocket
                    </button>
                </div>
            </div>

            <div className="pockets-grid">
                {pockets.length === 0 ? (
                    <div className="empty-state">
                        <p>No pockets yet! Create your first one to get started.</p>
                    </div>
                ) : (
                    pockets.map((pocket, index) => (
                        <div 
                            key={pocket.id} 
                            className="pocket-card"
                            style={{ backgroundColor: colors[index % colors.length] }}
                        >
                            <div className="pocket-content">
                                <h3 className="pocket-name">{pocket.name}</h3>
                                <p className="pocket-amount">€{pocket.amount}</p>
                            </div>
                            <button 
                                className="delete-icon" 
                                onClick={() => deletePocket(pocket.id)}
                                title="Delete pocket"
                            >
                                ×
                            </button>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Pocket</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={createPocket} className="pocket-form">
                            <div className="form-group">
                                <label htmlFor="name">Pocket Name</label>
                                <input
                                    type='text'
                                    id='name'
                                    name='name'
                                    required
                                    placeholder="e.g., Groceries, Rent, Fun Money"
                                    onChange={(e) => setName(e.target.value)}
                                    value={name}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="amount">Amount (€)</label>
                                <input
                                    type='number'
                                    id='amount'
                                    name='amount'
                                    required
                                    placeholder="0.00"
                                    step="0.01"
                                    onChange={(e) => setAmount(e.target.value)}
                                    value={amount}
                                />
                            </div>
                            <button type="submit" className="submit-btn">Create Pocket</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Home