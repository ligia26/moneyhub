const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { Parser } = require("json2csv");
const axios = require("axios");
const R = require("ramda");
const config = require("config");

const app = express();

app.use(bodyParser.json({ limit: "10mb" }));

// Correct the paths to the data.json files
const investmentsDataPath = path.resolve(
  __dirname,
  "../../investments/src/data.json"
);

// Construct the URLs for the investments and financial companies services using the configured ports
const investmentsServiceUrl = `${config.get(
  "investmentsServicePort"
)}/investments/export`;
const financialCompaniesServiceUrl = `${config.get(
  "financialCompaniesServicePort"
)}/companies`;

// Endpoint to get investment by ID
app.get("/investments/:id", (req, res) => {
  const { id } = req.params;
  // Read investments data from the JSON file
  const investments = JSON.parse(fs.readFileSync(investmentsDataPath));
  // Find the investment with the given ID using Ramda
  const investment = R.find(R.propEq("id", id), investments);
  if (investment) {
    res.send(investment);
  } else {
    res.sendStatus(404); // Send 404 if investment not found
  }
});

// Endpoint to generate and export CSV report
app.get("/generate-csv", async (req, res) => {
  try {
    // Read investments data from the JSON file
    const investments = JSON.parse(fs.readFileSync(investmentsDataPath));

    // Fetch company details from the financial companies service
    const companiesResponse = await axios.get(financialCompaniesServiceUrl);
    const companies = companiesResponse.data;

    // Function to get company name by ID
    const getCompanyNameById = (companyId) => {
      const company = R.find(R.propEq("id", companyId), companies);
      return company ? company.name : "Unknown";
    };

    // Function to calculate the value of an investment
    const calculateValue = (investmentTotal, investmentPercentage) =>
      investmentTotal * investmentPercentage;

    // Process the investments data to create CSV rows
    const data = investments.map((investment) => {
      const holdings = investment.holdings.map((holding) => ({
        Holding: getCompanyNameById(holding.id),
        Value: calculateValue(
          investment.investmentTotal,
          holding.investmentPercentage
        ),
      }));
      return {
        User: investment.userId,
        "First Name": investment.firstName,
        "Last Name": investment.lastName,
        Date: investment.date,
        Holdings: holdings.map((h) => h.Holding).join("; "),
        Values: holdings.map((h) => h.Value).join("; "),
      };
    });

    // Convert the processed data to CSV format
    const json2csvParser = new Parser({
      fields: ["User", "First Name", "Last Name", "Date", "Holdings", "Values"],
    });
    const csv = json2csvParser.parse(data);

    // Return the generated CSV as the response with content type text/csv
    res.header("Content-Type", "text/csv");
    res.send(csv);

    // Send the CSV data to the investments service's /export endpoint
    await axios.post(
      investmentsServiceUrl,
      { csv },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating CSV:", error);
    res.sendStatus(500); // Send 500 status if there is an error
  }
});

// Start the server and listen on the configured port
app.listen(config.get("port"), (err) => {
  if (err) {
    console.error("Error occurred starting the server", err);
    process.exit(1); // Exit if there is an error starting the server
  }
  console.log(`Server running on port ${config.get("port")}`);
});

module.exports = app;
