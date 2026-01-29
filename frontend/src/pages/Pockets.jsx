import { useState, useEffect } from "react"
import api from "../api"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import PocketForm from "../components/PocketForm"
import Pocket from "../components/Pocket"
import "../styles/Home.css"

function Home(){
    const [pockets, setPockets] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPocket, setEditingPocket] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [pocketToDelete, setPocketToDelete] = useState(null);

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
        api.delete(`api/pockets/delete/${id}/`).then((res)=>{
            if (res.status === 204) {
                getPockets()
                setShowDeleteConfirm(false);
                setPocketToDelete(null);
            }
        }).catch((error) => {
            alert('Failed to delete pocket.')
            setShowDeleteConfirm(false);
            setPocketToDelete(null);
        })
    };

    const handleDeleteClick = (e, id) => {
        e.stopPropagation();
        setPocketToDelete(id);
        setShowDeleteConfirm(true);
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
            'daily': 'Daily',
            'weekly': 'Weekly',
            'biweekly': 'Biweekly',
            '4-week': '4-Week',
            'monthly': 'Monthly',
            'quarterly': 'Quarterly',
            'yearly': 'Yearly'
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
                                                {pocket.amount_display && (
                                                    <>
                                                        <p className="pocket-amount">€{pocket.amount_display}</p>
                                                        <p className="pocket-frequency">
                                                            {getFrequencyLabel(pocket.frequency)}
                                                        </p>
                                                        <p className="pocket-items-count">
                                                            {pocket.items?.length || 0} item{(pocket.items?.length || 0) !== 1 ? 's' : ''}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                            <button 
                                                className="delete-icon" 
                                                onClick={(e) => handleDeleteClick(e, pocket.id)}
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

                    {showDeleteConfirm && (
                        <div className="confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
                            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                                <h3>Delete Pocket?</h3>
                                <p>This action cannot be undone.</p>
                                <div className="confirm-actions">
                                    <button 
                                        className="confirm-btn confirm-cancel"
                                        onClick={() => {
                                            setShowDeleteConfirm(false);
                                            setPocketToDelete(null);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        className="confirm-btn confirm-delete"
                                        onClick={() => deletePocket(pocketToDelete)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    )
}

export default Home