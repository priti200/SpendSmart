import { useState } from 'react';
import './App.css';

function App() {

  const [name,setName] = useState("");
  const [dateTime,setDateTime] = useState("");
  const [description,setDescription] = useState("");


  function addNewTransaction(){
    const url=process.env.REACT_APP_API_URL;
    fetch(url);
    // System.preventDefault();
  }
  return(
    <main>
      <h1>
        400<span>.00</span>{" "}
      </h1>

      <form 
        onSubmit={addNewTransaction}
      >
        <div className="basic">
          <input type="text" 
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder={"20000 mobile"} />
          <input type="datetime-local"
          value={dateTime}
          onChange={event => setDateTime(event.target.value)}
          />
        </div>
        
        <div className="description">
          <input type="text" 
          value={description}
          onChange={event => setDescription(event.target.value)}
          placeholder={"description"} />
        </div>

        <button>Add new transaction</button>
      </form>

      <div className="transactions">
        <div className="transaction">
          <div className="left">
            <div className="name">New Laptop</div>
            <div className="description">It was the time to buy new Laptop, Older one was damaged.</div>
          </div>

          <div className="right">
            <div className="price red">50,000</div>
            <div className="datetime">01-05-2024</div>

          </div>

        </div>
        <div className="transaction">
          <div className="left">
            <div className="name">New Laptop</div>
            <div className="description">It was the time to buy new Laptop, Older one was damaged.</div>
          </div>

          <div className="right">
            <div className="price green">50,000</div>
            <div className="datetime">01-05-2024</div>

          </div>

        </div>

        <div className="transaction">
          <div className="left">
            <div className="name">New Laptop</div>
            <div className="description">It was the time to buy new Laptop, Older one was damaged.</div>
          </div>

          <div className="right">
            <div className="price red">50,000</div>
            <div className="datetime">01-05-2024</div>

          </div>

        </div>
        <div className="transaction">
          <div className="left">
            <div className="name">New Laptop</div>
            <div className="description">It was the time to buy new Laptop, Older one was damaged.</div>
          </div>

          <div className="right">
            <div className="price green">50,000</div>
            <div className="datetime">01-05-2024</div>

          </div>

        </div>


      </div>
    </main>
  )
  
}

export default App;
