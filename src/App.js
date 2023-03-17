import logo from "./logo.png";
import "./App.css";
import numeral from "numeral";
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";

import {
  Navbar,
  Form,
  Badge,
  FloatingLabel,
  Table,
  Button,
  Alert,
  Container,
  Row,
  Col,
  Stack,
} from "react-bootstrap";

function App() {
  const [measurements, setMeasurements] = useState([]);

  const [percentileList, setPercentileList] = useState([95]);
  const [option, setOption] = useState("95");
  const [highStdDev, setHighStdDev] = useState(10); //10% of variation
  const [cv, setCV] = useState(0);
  const [hasResult, setHasResult] = useState(true);
  const [result, setResult] = useState([]);
  const [currStdDev, setCurrStdDev] = useState(0);
  const [currAvg, setCurrAvg] = useState(0);
  const [currVariance, setCurrVariance] = useState(0);
  const [currMedian, setCurrMedian] = useState(0);
  const [currValue, setCurrValue] = useState("");

  let sortedMeasurements = [];
  let count = 0;
  let sum = 0;
  let avg = 0;
  let squaredDiffs = 0;
  let variance = 0;
  let stdDev = 0;
  let median = 0;

  const zScores = {
    99.99: 3.89,
    99.95: 3.291,
    99.9: 3.09,
    99.5: 2.576,
    99: 2.326,
    97: 1.88,
    95: 1.645,
    90: 1.282,
    50: 0,
  };

  const formatNumber = (n) => {
    if (n < 1) {
      return numeral(n).format("0,0.00000");
    } else if (n < 1000) {
      return numeral(n).format("0,0.00");
    } else {
      return numeral(n).format("0,0");
    }
  };

  const calculate = () => {
    sortedMeasurements = measurements.slice().sort((a, b) => a - b);
    count = sortedMeasurements.length;
    sum = sortedMeasurements.reduce((acc, curr) => acc + curr, 0);
    avg = sum / count;
    squaredDiffs = sortedMeasurements.map((m) => (m - avg) ** 2);
    variance = squaredDiffs.reduce((acc, curr) => acc + curr, 0) / count;
    stdDev = Math.sqrt(variance);
    median =
      count % 2 === 0
        ? (sortedMeasurements[count / 2 - 1] + sortedMeasurements[count / 2]) /
          2
        : sortedMeasurements[Math.floor(count / 2)];

    setCurrStdDev(stdDev);
    setCurrAvg(avg);
    setCurrVariance(variance);
    setCurrMedian(median);
    setCV((stdDev / avg) * 100);

    let results = [];

    percentileList.forEach((percentile) => {
      const index = Math.ceil((count * percentile) / 100) - 1;
      const measurement = sortedMeasurements[index];
      const standardScore = (measurement - avg) / stdDev;
      const scalingFactor = zScores[percentile] || 0;
      const proposedSlo = avg + scalingFactor * stdDev;
      const result = {
        percentile,
        measurement,
        standardScore,
        scalingFactor,
        proposedSlo,
      };
      results.push(result);
    });

    setHasResult(results.length > 0 && !isNaN(results[0].proposedSlo));
    setResult(results);
  };

  const handleInputChange = (event) => {
    const v = event.target.value.trim();
    setCurrValue(v);

    if (currValue === "") {
      setMeasurements([]);
      event.target.value = "";
      return;
    }
    const delimiters = /[,;|\t\n\s]+/; // matches comma, semicolon, pipe, tab, space, or newline
    const inputMeasurements = v.split(delimiters).filter((x) => x !== "");

    try {
      const parsedMeasurements = inputMeasurements.map((measurement) =>
        parseFloat(measurement)
      );

      setMeasurements(parsedMeasurements.filter((m) => m !== NaN));
      event.target.value = parsedMeasurements.sort().toString();
    } catch (error) {
      // handle error
      console.log(error);
    }
  };

  const handleSelect = (chosenOption) => {
    setOption(chosenOption);

    if (chosenOption === "all") {
      setPercentileList([99.99, 99.95, 99.9, 99.5, 99, 97, 95, 90, 50]);

      return;
    }

    setPercentileList([parseFloat(chosenOption)]);
  };

  const handleStdDevConsistency = (event) => {
    setHighStdDev(parseFloat(event.target.value));

    const newCV = (currStdDev / currAvg) * 100;
    setCV(newCV);
  };

  useEffect(() => {
    calculate();
  }, [option]);

  const handleCalc = () => {
    calculate();
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" fixed="top">
        <Container fluid style={{ marginLeft: "2rem" }}>
          <Navbar.Brand>
            <Stack direction="horizontal" gap={2}>
              <img
                width={30}
                height={30}
                alt=""
                src={logo}
                className="d-inline-block "
              />
              <div>SLO Proposer</div>
            </Stack>
          </Navbar.Brand>
        </Container>
      </Navbar>
      <Container fluid className="p-5 mt-4">
        <h5>Enter Measurements</h5>
        <Form className="mb-4">
          <div>
            <Row className="mb-2">
              <Col>
                <FloatingLabel controlId="measurements" label="Measurements">
                  <Form.Control
                    as="textarea"
                    defaultValue={measurements}
                    placeholder="Paste your measurements here"
                    title="Paste your measurements here"
                    onBlur={handleInputChange}
                    style={{ height: "100px" }}
                    autoComplete="off"
                  />
                </FloatingLabel>
                <Button onClick={handleCalc} className="mt-3 mb-3">
                  Calculate
                </Button>
              </Col>
            </Row>
          </div>
        </Form>

        <Row
          style={{
            backgroundColor: "#fff",
            borderRadius: "10px",
            padding: "1rem 0.5rem",
            margin: "0rem",
          }}
        >
          {/* std analysis */}
          <Col>
            <h5>💎 Proposed SLOs by percentiles</h5>
            {hasResult ? (
              <>
                <Stack direction="horizontal" gap={2} className="mb-3">
                  <Button
                    key="p95"
                    variant={option === "95" ? "primary" : "light"}
                    onClick={() => handleSelect("95")}
                  >
                    <FontAwesomeIcon icon={faFilter} /> 95th only
                  </Button>

                  <Button
                    key="p99"
                    variant={option === "99" ? "primary" : "light"}
                    onClick={() => handleSelect("99")}
                  >
                    <FontAwesomeIcon icon={faFilter} /> 99th only
                  </Button>

                  <Button
                    key="pAll"
                    variant={option === "all" ? "primary" : "light"}
                    onClick={() => handleSelect("all")}
                  >
                    <FontAwesomeIcon icon={faFilter} /> all
                  </Button>
                </Stack>

                <Table striped hover size="sm">
                  <thead>
                    <tr>
                      <th className="text-center">Percentile</th>
                      <th className="text-center">Value</th>
                      <th className="text-center">Standard Score</th>
                      <th className="text-center">Scaling Factor</th>
                      <th className="text-center">Proposed SLO</th>
                      <th className="text-center">
                        Proposed SLO<br></br> + buffer 20%
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.map((result) => (
                      <tr
                        key={result.percentile}
                        className={
                          result.percentile === 95 ? "table-info" : undefined
                        }
                      >
                        <td className="text-center">
                          {formatNumber(result.percentile)}th
                        </td>
                        <td className="text-center">
                          {formatNumber(result.measurement)} s
                        </td>
                        <td className="text-center">
                          {formatNumber(result.standardScore)}
                        </td>
                        <td className="text-center">
                          {formatNumber(result.scalingFactor)}
                        </td>
                        <td className="text-center">
                          <strong>{formatNumber(result.proposedSlo)} s</strong>
                        </td>
                        <td className="text-center">
                          <strong>
                            {formatNumber(result.proposedSlo * 1.2)} s
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </>
            ) : (
              <Alert variant="info">No results</Alert>
            )}
          </Col>

          {/* percentiles */}
          <Col>
            {hasResult ? (
              <>
                <h5>📈 Standard deviation analysis</h5>
                <Row className="align-items-center mb-4">
                  <Col xs="auto">
                    <Form.Label htmlFor="average">Average</Form.Label>
                    <Form.Control
                      className="mb-2"
                      id="average"
                      type="text"
                      disabled
                      value={`${formatNumber(currAvg)} s`}
                    />
                  </Col>
                  <Col xs="auto">
                    <Form.Label htmlFor="median">Median</Form.Label>
                    <Form.Control
                      className="mb-2"
                      id="median"
                      type="text"
                      disabled
                      value={`${formatNumber(currMedian)} s`}
                    />
                  </Col>
                  <Col xs="auto">
                    <Form.Label htmlFor="variance">Variance</Form.Label>
                    <Form.Control
                      className="mb-2"
                      id="variance"
                      type="text"
                      title="Sum of the squared differences between each duration and the mean, divided by the total observed periods"
                      disabled
                      value={`${formatNumber(currVariance)} s`}
                    />
                  </Col>
                  <Col xs="auto">
                    <Form.Label htmlFor="stdDev">Standard Deviation</Form.Label>
                    <Form.Control
                      className="mb-2"
                      id="stdDev"
                      type="text"
                      title="Square root of variance. We used the standard deviation to measure the variability of the data. If the standard deviation is high, it could indicate that the durations are not consistent over time."
                      disabled
                      value={`${formatNumber(currStdDev)} s`}
                    />
                  </Col>
                </Row>
                <Row className="align-items-center">
                  <Col xs="auto" className="text-center">
                    <Form.Label htmlFor="highDtdDev">
                      Desired coeficient of variation
                    </Form.Label>
                    <Form.Range
                      id="highStdDev"
                      value={highStdDev}
                      onChange={handleStdDevConsistency}
                      min="0"
                      max="100"
                      step="5"
                      title="A ratio of standard deviation to the mean in to compare variability of measurements. It's the percentage you consider high for one standard deviation. An example of a high standard deviation is when the deviation in seconds is greater than 50% of the mean. So if the flow time is 2 seconds, a standard deviation of 1 second can be considered high. There is no certain %, it is necessary to consider the business, time of the dependencies, steps for the operation to conclude, infra, etc."
                    />
                    {highStdDev}%
                  </Col>

                  <Col xs="auto" className="text-center">
                    <Form.Label>Coeficient of variation</Form.Label>
                    <h4>
                      <Badge
                        id="cv"
                        bg={cv > highStdDev ? "danger" : "success"}
                        title={
                          cv > highStdDev
                            ? "The average is high or measurements are not consistent"
                            : "The average is reliable"
                        }
                      >
                        {cv.toFixed(2)}%
                      </Badge>
                    </h4>
                  </Col>
                  <Col xs="auto">
                    <Form.Label>Evaluation result</Form.Label>
                    <h6>
                      <Form.Label
                        className={cv > highStdDev ? "text-danger" : undefined}
                      >
                        {cv > highStdDev
                          ? "❌ The average is high or measurements are not consistent"
                          : "✅ The average is reliable"}
                      </Form.Label>
                    </h6>
                  </Col>
                </Row>
              </>
            ) : (
              <></>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
