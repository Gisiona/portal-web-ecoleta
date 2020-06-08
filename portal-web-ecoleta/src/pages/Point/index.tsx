import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import logo from '../../assets/logo.svg';
import { Link, useHistory } from "react-router-dom";
import {FiArrowRight } from 'react-icons/fi';
import './styles.css';
import { Map, TileLayer, Marker, Popup } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';
import api from '../../services/api';
// import axios from 'axios';

interface Item {
    id: number,
    title: string,
    image_url: string
}


interface IBGEUFResponse {
    id: number,
    sigla: string,
    nome: string,
    regiao: string
}


interface IBGECityResponse {
    id: number,
    nome: string,
}


const Poins = () => {

    const [items, setItems] = useState<Item[]>([]);
    const [ufIBGE, setUfIBGE] = useState<IBGEUFResponse[]>([]);
    const [cities, setCities] = useState<IBGECityResponse[]>([]);
    const [selectUf, setSelectUf] = useState("0");
    const [selectCity, setSelectCity] = useState("0");
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0,0]);
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0,0]);
    const [selectedItems, setSelectedItems] = useState<number[]>([0,0]);

    const [formData, setFormData] = useState({
        nome: "",
        email: "",
        whatsapp: "",
        rua: ""
    });

    const history = useHistory();
    
    // recupera a posição do usuário para carregar o mapa 
    useEffect( () => {
        navigator.geolocation.getCurrentPosition(position => {
            const {latitude, longitude } = position.coords;

            setInitialPosition([latitude, longitude]);

            console.log(position.coords)
        });

    }, []);


    useEffect( () => {
        api.get('items').then(response => { 
            console.log(response);
            setItems(response.data);
        });
    }, []);

    // recupara os estados do brasil na api do IBGE
    useEffect( () => {
        api.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados/').then(response => { 
            console.log(response);
            setUfIBGE(response.data);
        });
    }, []);


     // recupara as cidades de um determinado estado do brasil na api do IBGE
     useEffect( () => {
        
        if(selectUf === "0"){
            return;            
        }

        api.get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectUf}/distritos/`).then(response => { 
            console.log(response);
            setCities(response.data);
            console.log(cities);
        });
    }, [selectUf]);

    // funçao executada toda vez que ocorrer umaq mudança no estado UF
    function handleSelectUf(event: ChangeEvent<HTMLSelectElement>){
        const uf = event.target.value;
        setSelectUf(uf);
        console.log("Estado Selecionada: " + uf);
    }

    // funçao executada toda vez que ocorrer umaq mudança na cidade de um estado UF
    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>){
        const city = event.target.value;
        setSelectCity(city);
        console.log("Cidade Selecionada: " + city)
    }

     // funçao executada toda vez que ocorrer um click no mapa
    function handleMapClick(event: LeafletMouseEvent){
        console.log(event.latlng);
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ])
    }

    function handleSelectItem(id: number){

        console.log("cliquei no item: " + id)

        // verifico se o item selecionado ja esta na lista
        const alreadySelected = selectedItems.findIndex( item => item === id);
    
        if(alreadySelected >= 0){

            // seleciona todos os items já selecionado antes diferente do selecionado atual
            const filterreditems = selectedItems.filter(item => item !== id);    

            // atualiza a lista de items
            setSelectedItems(filterreditems);
        }else{

            // atualiza a lista de item com os existentes e atual item selecionado
            setSelectedItems([ ...selectedItems,id])
        }
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>){        
        console.log("Name: " + event.target.name)
        console.log("Value: " + event.target.value)

        const { name , value } = event.target;

        setFormData( {...formData, [name]: value })
    }
    
    async function handleSubmit(event: FormEvent){        
        event.preventDefault();
        const {nome, email, whatsapp, rua } = formData;

        const uf = selectUf;
        const city = selectCity;
        const items = selectedItems;
        const [latitude, longitude ] = selectedPosition;

        const data = {
            nome,
            email,
            whatsapp,
            rua,
            uf,
            city,
            latitude,
            longitude,
            items
        };

        console.log(data)

        await api.post("points", data).then(response => {
            alert("Ponto de coleta cadastrado com sucesso");
        }).catch(error => {
            alert("ERRO AO CADASTRAR POINT" + error);
        });

        // redireciona para tela inicial caso tudo de certo
        history.push("/");
    }
    
    return(
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>

                <Link to="/">
                    <FiArrowRight />
                    Voltar para home
                </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/> ponto de coleta </h1>
                <fieldset>
                    <legend><h2>Dados</h2></legend>

                    <div className="field">
                        <label htmlFor="nome" id="nome">Nome da entidade</label>
                        <input 
                            type="text" 
                            name="nome" 
                            id="nome"
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email" id="email">E-mail</label>
                            <input 
                                type="text" 
                                name="email" 
                                id="email"
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="whatsapp" id="whatsapp">Whatsapp</label>
                            <input 
                                type="text" 
                                name="whatsapp" 
                                id="whatsapp"
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend><h2>Endereço</h2>
                        <span>Selecione um endereço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15} onclick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                            <Marker position={selectedPosition}>
                            <Popup>
                                Selecione um ponto no mapa. <br /> que indique a sua localização.
                            </Popup>
                        </Marker>
                    </Map>

                    <div className="field">
                        <label htmlFor="rua" id="rua">Logradouro</label>
                        <input 
                            type="text" 
                            name="rua" 
                            id="rua"
                            onChange={handleInputChange}
                        />
                    </div>
                    
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select 
                                name="uf" 
                                id="uf" 
                                onChange={handleSelectUf} 
                                value={selectUf}
                            >
                                <option value="0">Selecione uma uf</option>
                                {
                                    ufIBGE.map(ufb => (
                                        <option value={ufb.sigla}> { ufb.sigla } </option>
                                    ))
                                }                                
                            </select>
                        </div>

                        <div className="field">
                            <label htmlFor="cidade">Cidade</label>
                            <select 
                                name="cidade" 
                                id="cidade"
                                value={selectCity}
                                onChange={handleSelectCity}
                            >
                                <option value="0">Selecione uma Cidade</option>
                                {
                                    cities.map(city => (
                                        <option value={city.id}> { city.nome } </option>
                                    ))
                                }
                            </select>
                        </div>

                    </div>
                </fieldset>

                <fieldset>
                    <legend><h2>Itens de coleta</h2>
                        <span>Selecione um ou mais itens de coleta abaixo</span>
                    </legend>

                    <ul className="items-grid">
                       {
                           items.map(item => (
                            <li 
                                key={item.id} 
                                onClick={() => handleSelectItem(item.id)}
                                className={selectedItems.includes(item.id) ? "selected" : ""}>
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li> 
                           ))
                       }                    
                    </ul>
                    
                </fieldset>

                <button type="submit">
                    Cadatrar ponto de coleta 
                </button>
            </form>
        </div>       
    );
}

export default Poins;
