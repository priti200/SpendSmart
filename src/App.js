import './App.css';

function App() {
  return(
    <main>
      <h1>
        400<span>.00</span>{" "}
      </h1>

      <form action="">
        <div className="basic">
          <input type="text" placeholder={"20000 mobile"} />
          <input type="datetime-local" />
        </div>
        
        <div className="description">
          <input type="text" placeholder={"description"} />
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
