let transactions = [];
let myChart;
let offlineTransactions = [];



function saveRecord(transaction) {
  let req = indexedDB.open("offlineTransactions", 1);
  //Handle Error
  req.onerror = e => {
    console.log(e.target.errorCode);
  }
  //Handle Upgrade
  req.onupgradeneeded = e => {
    let db = req.result,
      store = db.createObjectStore("TransactionStore", { keyPath: "date" }), //Store is like collection in Mongo or table in SQL
      index = store.createIndex("populated", "populated", { unique: false })
  }
  req.onerror = e => {
    console.log(e.target.errorCode);
  }
  //Handle Success
  req.onsuccess = function (e) {
    let db = req.result,
      tx = db.transaction("TransactionStore", "readwrite"), //transaction is like connection to the database
      store = tx.objectStore("TransactionStore"), //get an instance of the table to work with it
      index = store.index("populated");
    db.onerror = e => {
      console.log(e.target.errorCode);
    }
    //Insert into Database
    store.put({ populated: 0, ...transaction })
    console.log({ populated: 0, ...transaction });
    //Close Database
    tx.oncomplete = () => {
      db.close();
    }

  }

}

function populateSavedRecords() {
  let req = indexedDB.open("offlineTransactions", 1);
  //Handle Error
  req.onerror = e => {
    console.log(e.target.errorCode);
  }
  //Handle Upgrade
  req.onupgradeneeded = e => {
    let db = req.result,
      store = db.createObjectStore("TransactionStore", { keyPath: "date" }), //Store is like collection in Mongo or table in SQL
      index = store.createIndex("populated", "populated", { unique: false })
  }
  req.onerror = e => {
    console.log(e.target.errorCode);
  }
  //Handle Success
  req.onsuccess = e => {
    let db = req.result,
      tx = db.transaction("TransactionStore", "readwrite"), //transaction is like connection to the database
      store = tx.objectStore("TransactionStore"), //get an instance of the table to work with it
      index = store.index("populated");
    db.onerror = e => {
      console.log(e.target.errorCode);
    }

    //Retrieve Data
    let transactions = index.getAll(0);
    transactions.onerror = () => {
      console.log('error');
    }
    transactions.onsuccess = () => {
      let offline = transactions.result;
      if (transactions.result.length > 0) {
        for (let transaction of transactions.result) {
          const { name, date, value } = transaction
          //update Database
          store.put({ populated: 1, name, date, value })
        }
        console.log(offline, typeof offline);
        $.post('/api/bulk', { data: JSON.stringify(offline) })
          .then(res => console.log(res))
          .catch(err => console.log(err))
      }
    }
    //Close Database
    tx.oncomplete = () => {
      db.close();
    }

  }
}
populateSavedRecords();

fetch("/api/transaction")
  .then(response => {
    return response.json();
  })
  .then(data => {
    // save db data on global variable
    transactions = data;
    // console.log(data);
    populateTotal();
    populateTable();
    populateChart();
  });

function populateTotal() {
  // reduce transaction amounts to a single total value
  let total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);

  let totalEl = document.querySelector("#total");
  totalEl.textContent = total;
}

function populateTable() {
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  transactions.forEach(transaction => {
    // create and populate a table row
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    tbody.appendChild(tr);
  });
}

function populateChart() {
  // copy array and reverse it
  let reversed = transactions.slice().reverse();
  let sum = 0;

  // create date labels for chart
  let labels = reversed.map(t => {
    let date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  let data = reversed.map(t => {
    sum += parseInt(t.value);
    return sum;
  });

  // remove old chart if it exists
  if (myChart) {
    myChart.destroy();
  }

  let ctx = document.getElementById("myChart").getContext("2d");

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: "Total Over Time",
        fill: true,
        backgroundColor: "#6666ff",
        data
      }]
    }
  });
}

function sendTransaction(isAdding) {
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");

  // validate form
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  }
  else {
    errorEl.textContent = "";
  }

  // create record
  let transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString()
  };

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();

  // also send to server
  fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    }
  })
    .then(response => {
      return response.json();
    })
    .then(data => {
      if (data.errors) {
        errorEl.textContent = "Missing Information";
      }
      else {
        // clear form
        nameEl.value = "";
        amountEl.value = "";
      }
    })
    .catch(err => {
      // fetch failed, so save in indexed db
      saveRecord(transaction);

      // clear form
      nameEl.value = "";
      amountEl.value = "";
    });
}

document.querySelector("#add-btn").onclick = function () {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function () {
  sendTransaction(false);
};

