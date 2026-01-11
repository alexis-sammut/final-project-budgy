import { useState, useEffect } from "react"
import api from "../api"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import PocketForm from "../components/PocketForm"
import "../styles/Home.css"

function Home(){
    const [pockets, setPockets] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPocket, setEditingPocket] = useState(null);

    useEffect(()=> {
        getPockets();
    }, [])

    const getPockets = () => {
        api
            .get("/api/pockets/")
            .then((res) => res.data)
            .then((data) => { 
                setPockets(data); 
                console.log(data);
            })
            .catch((err) => alert(err));
    }

    const deletePocket = (id) => {
        if (!confirm("Are you sure you want to delete this pocket?")) return;
        
        api.delete(`api/pockets/delete/${id}/`).then((res)=>{
            if (res.status === 204) {
                alert('Pocket deleted!')
                getPockets()
            } else {
                alert('Failed to delete pocket.')
            }   
        }).catch((error) => alert(error))
    };

    const handleEdit = (pocket) => {
        setEditingPocket(pocket);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPocket(null);
    };

    const getFrequencyLabel = (frequency) => {
        const labels = {
            'none': 'No recurring',
            'weekly': 'Weekly',
            'biweekly': 'Biweekly',
            'monthly': 'Monthly'
        };
        return labels[frequency] || frequency;
    };

    // Group pockets by category
    const groupedPockets = pockets.reduce((groups, pocket) => {
        const categoryName = pocket.category_name || 'Uncategorized';
        if (!groups[categoryName]) {
            groups[categoryName] = [];
        }
        groups[categoryName].push(pocket);
        return groups;
    }, {});

    // Sort categories: Uncategorized last, others alphabetically
    const sortedCategories = Object.keys(groupedPockets).sort((a, b) => {
        if (a === 'Uncategorized') return 1;
        if (b === 'Uncategorized') return -1;
        return a.localeCompare(b);
    });

    return (
        <>
            <Navbar />
            <div className="home-container">
                <div className="home-content">
                    <div className="page-header">
                        <h1>My Pockets</h1>
                        <button className="create-btn" onClick={() => setShowModal(true)}>
                            + Create Pocket
                        </button>
                    </div>

                    {pockets.length === 0 ? (
                        <div className="empty-state">
                            <p>No pockets yet! Create your first one to get started.</p>
                        </div>
                    ) : (
                        sortedCategories.map((categoryName) => (
                            <div key={categoryName} className="category-section">
                                <h2 className="category-title">{categoryName}</h2>
                                <div className="category-divider"></div>
                                <div className="pockets-grid">
                                    {groupedPockets[categoryName].map((pocket) => (
                                        <div 
                                            key={pocket.id} 
                                            className="pocket-card"
                                            style={{ backgroundColor: pocket.color }}
                                            onClick={() => handleEdit(pocket)}
                                        >
                                            <div className="pocket-content">
                                                <h3 className="pocket-name">{pocket.name}</h3>
                                                {pocket.amount && (
                                                    <>
                                                        <p className="pocket-amount">€{pocket.amount}</p>
                                                        <p className="pocket-frequency">
                                                            {getFrequencyLabel(pocket.frequency)}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                            <button 
                                                className="delete-icon" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deletePocket(pocket.id);
                                                }}
                                                title="Delete pocket"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}

                    {showModal && (
                        <PocketForm 
                            onClose={handleCloseModal}
                            onPocketCreated={getPockets}
                            editingPocket={editingPocket}
                        />
                    )}
                </div>
            </div>
            <Footer />
        </>
    )
}

export default Home