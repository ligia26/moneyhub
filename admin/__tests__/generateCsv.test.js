const request = require("supertest");
const fs = require("fs");
const axios = require("axios");
const app = require("../src/index.js");

jest.mock("fs");
jest.mock("axios");
jest.mock("config", () => ({
  get: jest.fn((key) => {
    if (key === "port") return 8083;
    if (key === "investmentsServicePort") return "http://localhost:8081";
    if (key === "financialCompaniesServicePort") return "http://localhost:8082";
    return null;
  }),
}));

describe("Investment API", () => {
  describe("GET /investments/:id", () => {
    it("should return an investment when it exists", async () => {
      const mockInvestments = [
        { id: "1", userId: "user1", firstName: "John", lastName: "Doe" },
      ];
      fs.readFileSync.mockReturnValue(JSON.stringify(mockInvestments));

      const response = await request(app).get("/investments/1");
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockInvestments[0]);
    });

    it("should return 404 when investment does not exist", async () => {
      const mockInvestments = [
        { id: "1", userId: "user1", firstName: "John", lastName: "Doe" },
      ];
      fs.readFileSync.mockReturnValue(JSON.stringify(mockInvestments));

      const response = await request(app).get("/investments/2");
      expect(response.status).toBe(404);
    });
  });

  describe("GET /generate-csv", () => {
    it("should generate and return a CSV file", async () => {
      const mockInvestments = [
        {
          id: "1",
          userId: "user1",
          firstName: "John",
          lastName: "Doe",
          date: "2023-01-01",
          investmentTotal: 10000,
          holdings: [
            { id: "company1", investmentPercentage: 0.5 },
            { id: "company2", investmentPercentage: 0.5 },
          ],
        },
      ];
      fs.readFileSync.mockReturnValue(JSON.stringify(mockInvestments));

      const mockCompanies = [
        { id: "company1", name: "Company A" },
        { id: "company2", name: "Company B" },
      ];
      axios.get.mockResolvedValue({ data: mockCompanies });
      axios.post.mockResolvedValue({});

      const response = await request(app).get("/generate-csv");
      expect(response.status).toBe(200);
      expect(response.header["content-type"]).toMatch(/^text\/csv/);
      expect(response.text).toContain(
        '"User","First Name","Last Name","Date","Holdings","Values"'
      );
      expect(response.text).toContain(
        '"user1","John","Doe","2023-01-01","Company A; Company B","5000; 5000"'
      );
    });

    it("should handle errors and return 500 status", async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error("File read error");
      });

      const response = await request(app).get("/generate-csv");
      expect(response.status).toBe(500);
    });
  });
});

