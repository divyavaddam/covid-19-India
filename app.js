const express = require("express");
const app = express();
app.use(express.json());
module.exports = app;
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertStateTableDBObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertDistrictTableDBObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};
const convertToPascalCase = (dbObject) => {
  return {
    stateName: dbObject.state_name,
  };
};
//GET STATES API
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT 
      *
    FROM 
      state 
    ORDER BY 
      state_id;
    `;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((item) => convertStateTableDBObjectToResponseObject(item))
  );
});
// GET STATE API
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
  SELECT * FROM state WHERE state_id=${stateId};
  `;
  const state = await db.get(getStateQuery);
  response.send(convertStateTableDBObjectToResponseObject(state));
});
// POST DISTRICT
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
  INSERT INTO 
    district(district_name,state_id,cases,cured,active,deaths)
  VALUES
    ('${districtName}',${stateId},${cases},${cured},${active},${deaths});
  `;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});
// GET DISTRICT API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
  SELECT * FROM district WHERE district_id=${districtId};
  `;
  const district = await db.get(getDistrictQuery);
  response.send(convertDistrictTableDBObjectToResponseObject(district));
});
//DELETE DISTRICT
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
  DELETE FROM district 
  WHERE district_id=${districtId};
  `;
  await db.run(deleteQuery);
  response.send("District Removed");
});
//UPDATE DISTRICT API
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
  UPDATE 
    district
  SET
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
  WHERE 
    district_id=${districtId};
  `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});
// GET TOTAL STATISTICS
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalStatisticsQuery = `
  SELECT 
      SUM(cases) AS totalCases, 
      SUM(cured) AS totalCured, 
      SUM(active) AS totalActive, 
      SUM(deaths) AS totalDeaths
  FROM district 
  WHERE state_id=${stateId};
  `;
  const result = await db.get(getTotalStatisticsQuery);
  response.send(result);
});
// GET STATE NAME OF A DISTRICT BASED ON DISTRICT ID API
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateQuery = `
    SELECT 
      state.state_name
    FROM district 
    INNER JOIN state ON 
    district.state_id=state.state_id
    WHERE 
      district.district_id=${districtId};
    `;
  const result = await db.get(getStateQuery);
  response.send(convertToPascalCase(result));
});
