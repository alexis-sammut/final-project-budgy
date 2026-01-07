import { useState, useEffect } from "react"
import api from "../api"
import Pocket from '../components/Pocket'

function Home(){
    const [pockets, setPockets] = useState([]);
    const [amount, setAmount] = useState("");
    const [name, setName] = useState("");

    useEffect(()=> {
        getPockets();
    }, [])

    const getPockets =() => {
        api
            .get("/api/pockets/")
            .then((res) => res.data)
            .then((data) => { setPockets(data) ; console.log(data)})
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
            if (res.status === 201) alert('Pocket created!')
            else alert('Failed to create pocket.')
            getPockets()
        }).catch((err) => alert(err));
    };

    return <div>
            <div>
                <h2>Pockets</h2>
                {pockets.map((pocket)=> (
                    <Pocket pocket={pocket} onDelete={deletePocket} key={pocket.id}/>
                ))}
        </div> 
        <form onSubmit={createPocket}>
            <label htmlFor="name">Pocket Name</label>
            <br/>
            <input
                type='text'
                id='name'
                name='name'
                required
                onChange={(e)=> setName(e.target.value)}
                value={name}
            />
            <label htmlFor="amount">Pocket amount</label>
            <br/> 
            <input
                type='number'
                id='amount'
                name='amount'
                required
                onChange={(e)=> setAmount(e.target.value)}
                value={amount}
            />
            <br/> 
        <input type="submit" value='Submit'></input>
        </form>
        </div>
}

export default Home