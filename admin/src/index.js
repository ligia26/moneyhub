const express = require("express")
const bodyParser = require("body-parser")
const config = require("config")
const fs = require("fs");
const path = require("path");
const { Parser } = require("json2csv")
const R = require("ramda")

const app = express()

app.use(bodyParser.json({limit: "10mb"}))
// Endpoint to get investment by ID
app.get("/investments/:id", (req, res) => {
  const { id } = req.params;
  const investments = JSON.parse(fs.readFileSync(path.join(__dirname, "../investments/data.json")));
  const investment = R.find(R.propEq("id", id), investments);
  if (investment) {
    res.send(investment);
  } else {
    res.sendStatus(404);
  }
});

// Endpoint to generate and export CSV report
app.get("/generate-csv", async (req, res) => {
  try {
    // Read investments data
    const investments = JSON.parse(fs.readFileSync(path.join(__dirname, "../investments/data.json")));

    // Read company details
    const companies = JSON.parse(fs.readFileSync(path.join(__dirname, "../financial-companies/data.json")));

    // Function to get company name by ID
    const getCompanyNameById = (companyId) => {
      const company = R.find(R.propEq('id', companyId), companies);
      return company ? company.name : "Unknown";
    };

    // Function to calculate the value of investment
    const calculateValue = (investment) => investment.investmentTotal * investment.investmentPercentage;

    // Process data
    const data = investments.map(investment => ({
      User: investment.userId,
      "First Name": investment.userFirstName,
      "Last Name": investment.userLastName,
      Date: investment.date,
      Holding: getCompanyNameById(investment.companyId),
      Value: calculateValue(investment)
    }));

    // Convert data to CSV
    const json2csvParser = new Parser({ fields: ["User", "First Name", "Last Name", "Date", "Holding", "Value"] });
    const csv = json2csvParser.parse(data);

    // Send CSV to investments service
    await axios.post(
      `http://localhost:8081/investments/export`,
      { csv },
      { headers: { "Content-Type": "application/json" } }
    );

    // Return CSV as text
    res.header("Content-Type", "text/csv");
    res.send(csv);
  } catch (error) {
    console.error("Error generating CSV:", error);
    res.sendStatus(500);
  }
});

app.listen(config.port, (err) => {
  if (err) {
    console.error("Error occurred starting the server", err);
    process.exit(1);
  }
  console.log(`Server running on port ${config.port}`);
});

module.exports = app;