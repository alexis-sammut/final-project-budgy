import { useState, useEffect } from "react"
import api from "../api"

function Home(){
    const [pockets, setPockets] = useState([]);
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");

    useEffect(()=> {
        getPocket();
    }, [])

    const getPocket =() => {
        api
            .get("/api/pockets/")
            .then((res) => res.data)
            .then((data) => { setPockets(data) ; console.log(data)})
            .catch((err) => alert(err));
    }

    return <div>Home</div>
}

export default Home