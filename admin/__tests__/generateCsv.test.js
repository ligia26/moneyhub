const request = require("supertest");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const app = require("../src/index"); // Adjust the path if necessary

jest.mock("axios");
jest.mock("fs");

// Mock the config module
jest.mock("config", () => ({
  get: jest.fn((key) => {
    const config = {
      port: 8083,
      investmentsServicePort: 8081,
      financialCompaniesServicePort: 8082,
    };
    return config[key];
  }),
}));

// Mock data paths
const investmentsDataPath = path.resolve(
  __dirname,
  "../../investments/src/data.json"
);
const companiesDataPath = path.resolve(
  __dirname,
  "../../financial-companies/src/data.json"
);

// Correctly mock fs.readFileSync to avoid infinite recursion
const mockReadFileSync = (filePath) => {
  if (filePath === investmentsDataPath) {
    return fs.__originalReadFileSync(
      path.resolve(__dirname, "../../investments/src/data.json"),
      "utf8"
    );
  }
  if (filePath === companiesDataPath) {
    return fs.__originalReadFileSync(
      path.resolve(__dirname, "../../financial-companies/src/data.json"),
      "utf8"
    );
  }
  return null;
};

beforeAll(() => {
  fs.__originalReadFileSync = fs.readFileSync;
  fs.readFileSync = jest.fn(mockReadFileSync);
});

// Mocking the file system read operation
beforeEach(() => {
  fs.readFileSync.mockClear();

  // Mocking axios get for companies data
  axios.get.mockImplementation((url) => {
    console.log(`Axios GET request to URL: ${url}`); // Log the URL
    if (url.includes("companies")) {
      return Promise.resolve({
        data: JSON.parse(
          fs.__originalReadFileSync(
            path.resolve(__dirname, "../../financial-companies/src/data.json"),
            "utf8"
          )
        ),
      });
    }
    return Promise.reject(new Error("not found"));
  });

  // Mocking axios post for export endpoint
  axios.post.mockImplementation((url, data) => {
    console.log(
      `Axios POST request to URL: ${url} with data: ${JSON.stringify(data)}`
    ); // Log the URL and data
    return Promise.resolve();
  });

  // Start the server before each test
  global.server = app.listen(8083, () => {
    console.log("Server started on port 8083");
  });
});

afterEach((done) => {
  // Close the server after each test
  global.server.close(done);
  jest.resetAllMocks();
});

describe("GET /generate-csv", () => {
  it("should generate a CSV report", async () => {
    const response = await request(global.server)
      .get("/generate-csv")
      .expect("Content-Type", /text\/csv/)
      .expect(200);

    console.log("CSV Response:", response.text); // Log the response for debugging

    const expectedCsvHeaders =
      '"User","First Name","Last Name","Date","Holdings","Values"';
    expect(response.text).toContain(expectedCsvHeaders);
    expect(response.text).toContain(
      '"1","Billy","Bob","2020-01-01","The Small Investment Company","1400"'
    );
    expect(response.text).toContain(
      '"2","Sheila","Aussie","2020-01-01","The Big Investment Company;The Small Investment Company","10000;10000"'
    );
  });
});

describe("GET /investments/:id", () => {
  it("should get an investment by id", async () => {
    const investmentId = "1";
    const investmentsData = JSON.parse(
      fs.__originalReadFileSync(
        path.resolve(__dirname, "../../investments/src/data.json"),
        "utf8"
      )
    );
    const expectedInvestment = investmentsData.find(
      (investment) => investment.id === investmentId
    );

    const response = await request(global.server)
      .get(`/investments/${investmentId}`)
      .expect("Content-Type", /json/)
      .expect(200);

    console.log("Investment Response:", response.body); // Log the response for debugging

    expect(response.body).toEqual(expectedInvestment);
  });

  it("should return 404 if investment not found", async () => {
    const response = await request(global.server)
      .get("/investments/9999")
      .expect(404);

    console.log("404 Response:", response.text); // Log the response for debugging

    expect(response.text).toBe("Not Found");
  });
});
