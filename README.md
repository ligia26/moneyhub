# Moneyhub Tech Test - Investments and Holdings

At Moneyhub we use microservices to partition and separate the concerns of the codebase. In this exercise we have given you an example `admin` service and some accompanying services to work with. In this case the admin service backs a front end admin tool allowing non-technical staff to interact with data.

A request for a new admin feature has been received

## Requirements

- As an admin, I want to be able to generate a CSV report showing the values of all user investment holdings
    - Any new routes should be added to the **admin** service
    - The csv report should be sent to the `/export` route of the **investments** service
    - The investments `/export` route expects the following:
        - content-type as `application/json`
        - JSON object containing the report as csv string, i.e, `{csv: '|User|First Name|...'}`
    - The csv should contain a row for each holding matching the following headers
    |User|First Name|Last Name|Date|Holding|Value|
    - The **Holding** property should be the name of the holding account given by the **financial-companies** service
    - The **Value** property can be calculated by `investmentTotal * investmentPercentage`
    - The new route in the admin service handling the generation of the csv report should return the csv as text with content type `text/csv`
- Ensure use of up to date packages and libraries (the service is known to use deprecated packages but there is no expectation to replace them)
- Make effective use of git

We prefer:
- Functional code
- Ramda.js (this is not a requirement but feel free to investigate)
- Unit testing

### Notes
All of you work should take place inside the `admin` microservice

For the purposes of this task we would assume there are sufficient security middleware, permissions access and PII safe protocols, you do not need to add additional security measures as part of this exercise.

You are free to use any packages that would help with this task

We're interested in how you break down the work and build your solution in a clean, reusable and testable manner rather than seeing a perfect example, try to only spend around *1-2 hours* working on it

## Deliverables
**Please make sure to update the readme with**:

- Your new routes
- How to run any additional scripts or tests you may have added
- Relating to the task please add answers to the following questions;
    1. How might you make this service more secure?
    2. How would you make this solution scale to millions of records?
    3. What else would you have liked to improve given more time?


On completion email a link to your repository to your contact at Moneyhub and ensure it is publicly accessible.

## Getting Started

Please clone this service and push it to your own github (or other) public repository

To develop against all the services each one will need to be started in each service run

```bash
npm start
or
npm run develop
```

The develop command will run nodemon allowing you to make changes without restarting

The services will try to use ports 8081, 8082 and 8083

Use Postman or any API tool of you choice to trigger your endpoints (this is how we will test your new route).

### Existing routes
We have provided a series of routes

Investments - localhost:8081
- `/investments` get all investments
- `/investments/:id` get an investment record by id
- `/investments/export` expects a csv formatted text input as the body

Financial Companies - localhost:8082
- `/companies` get all companies details
- `/companies/:id` get company by id

Admin - localhost:8083
- `/investments/:id` get an investment record by id

## New Routes

### Get CSV file structured as "User","First Name","Last Name","Date","Holdings","Values"
Admin - localhost:8083
- `/generate-csv` generates a CSV report of all user investment holdings and exports it to the investments service.

Investments - localhost:8081
- `/investments/export` - Expects a CSV formatted text input as the body

### Tests
Install dependencies:
npm install --save-dev jest supertest
Test Scripts:
Add this to your package.json:
"scripts": {
  "test": "jest"
}
Run tests with npm test under admin folder.

## Questions
1.How would you make this service more secure?
To enhance the security of this service, I would:

- Implement Authentication and Authorization: Ensure that only authenticated users can access the service, and implement role-based access control to limit actions based on user roles.
- Validate Inputs: Add input validation to prevent SQL injection, cross-site scripting (XSS), and other common attacks.
- Use HTTPS: Encrypt data in transit by using HTTPS, ensuring that all communications between clients and the server are secure.
- Rate Limiting: Implement rate limiting to protect against denial-of-service (DoS) attacks by limiting the number of requests a user can make in a given time period.

2.How would you make this solution scale to millions of records?
To scale this solution to handle millions of records, I would:

- Database Optimization: Use indexing, partitioning, and optimized queries to handle large datasets efficiently.
- Microservices Architecture: Break down the application into microservices, allowing each service to scale independently based on its specific needs.
- Load Balancing: Distribute incoming requests across multiple server instances using load balancers to prevent any single server from being overwhelmed.
- Asynchronous Processing: Use message queues and background workers to handle long-running tasks asynchronously, ensuring that the system remains responsive.
  
3.What else would you have liked to improve given more time?
Given more time, I would have liked to:

- Enhance Testing: Add more comprehensive unit and integration tests to ensure all parts of the system are thoroughly tested.
- Optimize Performance: Conduct performance profiling and optimization to improve the system's responsiveness and efficiency.
- Implement CI/CD: Set up a continuous integration and continuous deployment (CI/CD) pipeline to automate testing and deployment, ensuring that changes are quickly and safely delivered to production.



