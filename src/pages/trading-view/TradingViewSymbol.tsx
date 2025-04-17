import { useRef, useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  createChart,
  LineSeries,
  CandlestickSeries,
  AreaSeries,
  IChartApi,
} from "lightweight-charts";
import {
  Button,
  Card,
  Space,
  Typography,
  Select,
  Spin,
  InputNumber,
  Form,
  Radio,
  Divider,
  message,
  Tooltip,
  Row,
  Col,
  Input,
  Tabs,
  Tag,
} from "antd";
import {
  ArrowLeftOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import "./TradingView.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Sample candle data - replace with actual API data
const generateSampleData = (symbol: string, days = 60) => {
  const data = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Start price - random based on symbol to make each chart look different
  let price =
    (symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
      1000) +
    500;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Generate candle data with some randomness
    const volatility = price * 0.03;
    const open = price * (1 + (Math.random() * 0.02 - 0.01));
    const high = open * (1 + Math.random() * 0.02);
    const low = open * (1 - Math.random() * 0.02);
    const close =
      (open + high + low) / 3 + (Math.random() * volatility - volatility / 2);

    data.push({
      time: date.toISOString().split("T")[0],
      open,
      high,
      close,
      low,
    });

    // Update price for next iteration
    price = close;
  }

  return data;
};

// Get the current price from the data
const getCurrentPrice = (data: any[]) => {
  if (!data || data.length === 0) return 0;
  return data[data.length - 1].close;
};

// Determine if a symbol is forex
const isForexSymbol = (symbol: string) => {
  const forexPatterns = [
    "EUR",
    "USD",
    "GBP",
    "JPY",
    "AUD",
    "NZD",
    "CAD",
    "CHF",
  ];

  return (
    forexPatterns.some((pattern) => symbol.includes(pattern)) &&
    !symbol.includes("USDT")
  );
};

// Popular trading symbols for the top bar
const POPULAR_SYMBOLS = [
  { symbol: "EURUSD", price: 1.13992, change: 0.12 },
  { symbol: "GBPUSD", price: 1.25262, change: -0.08 },
  { symbol: "USDJPY", price: 142.325, change: 0.23 },
  { symbol: "XAUUSD", price: 1324.429, change: -0.42 },
  { symbol: "BTCUSD", price: 64592.94, change: 2.14 },
  { symbol: "ETHUSD", price: 3420.18, change: 1.52 },
];

type ChartType = "candles" | "line" | "area";
type TimeFrame = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1D" | "1W";
type TradeType = "buy" | "sell";
type OrderType = "market" | "limit" | "stop";

export function TradingViewSymbol() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState<ChartType>("candles");
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1h");
  const [isLoading, setIsLoading] = useState(true);
  const [form] = Form.useForm();

  const [chartInstance, setChartInstance] = useState<IChartApi | null>(null);
  const [seriesInstance, setSeriesInstance] = useState<any>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [tradeType, setTradeType] = useState<TradeType>("buy");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [executing, setExecuting] = useState(false);
  const [balance, setBalance] = useState(10000);
  const [isChartDisposed, setIsChartDisposed] = useState(false);

  // Create a ref to store the resize handler
  const resizeHandlerRef = useRef<((event: UIEvent) => void) | null>(null);

  // Handle going back to symbol list
  const handleBack = () => {
    navigate("/trading-view");
  };

  // Initialize chart
  useEffect(() => {
    // Don't initialize if we're about to dispose or container isn't ready
    if (!chartContainerRef.current || !symbol) return;

    // Create chart ref to track in closure
    let isComponentMounted = true;

    // Reset the disposed flag when creating a new chart
    setIsChartDisposed(false);

    // Clean up previous chart if exists
    if (chartInstance) {
      try {
        chartInstance.remove();
      } catch (error) {
        console.error("Error removing previous chart:", error);
      }
    }

    let chart: IChartApi | null = null;
    const container = chartContainerRef.current;

    try {
      chart = createChart(container, {
        width: container.clientWidth,
        height: 500,
        layout: {
          background: { color: "#131722" },
          textColor: "#d1d4dc",
        },
        grid: {
          vertLines: { color: "#1f2937" },
          horzLines: { color: "#1f2937" },
        },
        timeScale: {
          borderColor: "#2a2e39",
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          mode: 0,
          vertLine: {
            color: "#758696",
            width: 1,
            style: 1,
            visible: true,
            labelVisible: false,
          },
          horzLine: {
            color: "#758696",
            width: 1,
            style: 1,
            visible: true,
            labelVisible: true,
          },
        },
      });

      // Create resize handler
      const handleResize = () => {
        if (container && chart && !isChartDisposed && isComponentMounted) {
          try {
            chart.applyOptions({ width: container.clientWidth });
          } catch (error) {
            console.error("Error resizing chart:", error);
          }
        }
      };

      // Store in ref for cleanup
      resizeHandlerRef.current = handleResize;

      window.addEventListener("resize", handleResize);

      if (isComponentMounted) {
        setChartInstance(chart);
      }
    } catch (error) {
      console.error("Error creating chart:", error);
    }

    return () => {
      isComponentMounted = false;

      // Clean up event listener
      if (resizeHandlerRef.current) {
        window.removeEventListener("resize", resizeHandlerRef.current);
        resizeHandlerRef.current = null;
      }

      setIsChartDisposed(true);

      if (chart) {
        try {
          chart.remove();
        } catch (error) {
          console.error("Error removing chart on cleanup:", error);
        }
      }

      // Set references to null to help garbage collection
      setChartInstance(null);
      setSeriesInstance(null);
    };
  }, [symbol]);

  // Update chart when chartType or timeFrame changes
  useEffect(() => {
    if (!chartInstance || !symbol || isChartDisposed) return;

    // Track if the effect is still active
    let isEffectActive = true;

    // Remove previous series if exists
    if (seriesInstance) {
      try {
        chartInstance.removeSeries(seriesInstance);
      } catch (error) {
        console.error("Error removing series:", error);
        return;
      }
    }

    setIsLoading(true);

    // Simulate API data loading
    const timeoutId = setTimeout(() => {
      // Check if effect is still active
      if (!isEffectActive || isChartDisposed) {
        console.log("Chart update cancelled - component changed or disposed");
        setIsLoading(false);
        return;
      }

      // Map timeframes to days for sample data
      const daysMap: Record<TimeFrame, number> = {
        "1m": 1,
        "5m": 1,
        "15m": 1,
        "30m": 2,
        "1h": 7,
        "4h": 14,
        "1D": 60,
        "1W": 180,
      };

      try {
        // Check again if chart is disposed before proceeding
        if (!chartInstance || isChartDisposed) {
          setIsLoading(false);
          return;
        }

        const candleData = generateSampleData(symbol, daysMap[timeFrame]);

        if (isEffectActive) {
          setChartData(candleData);
          setCurrentPrice(getCurrentPrice(candleData));
        }

        // Check again before creating series
        if (!chartInstance || isChartDisposed || !isEffectActive) {
          setIsLoading(false);
          return;
        }

        let newSeries;

        if (chartType === "candles") {
          newSeries = chartInstance.addSeries(CandlestickSeries);
          newSeries.applyOptions({
            upColor: "#00a781",
            downColor: "#ff4a68",
            borderVisible: false,
            wickUpColor: "#00a781",
            wickDownColor: "#ff4a68",
          });
          newSeries.setData(candleData);
        } else if (chartType === "line") {
          newSeries = chartInstance.addSeries(LineSeries);
          newSeries.applyOptions({
            color: "#2962FF",
            lineWidth: 2,
          });
          // Convert candle data to line data
          const lineData = candleData.map((item) => ({
            time: item.time,
            value: item.close,
          }));
          newSeries.setData(lineData);
        } else if (chartType === "area") {
          newSeries = chartInstance.addSeries(AreaSeries);
          newSeries.applyOptions({
            topColor: "rgba(41, 98, 255, 0.28)",
            bottomColor: "rgba(41, 98, 255, 0.05)",
            lineColor: "rgba(41, 98, 255, 1)",
            lineWidth: 2,
          });
          // Convert candle data to line/area data
          const areaData = candleData.map((item) => ({
            time: item.time,
            value: item.close,
          }));
          newSeries.setData(areaData);
        }

        // Check if still active before updating state
        if (isEffectActive) {
          setSeriesInstance(newSeries);

          // Fit content to view
          if (chartInstance && !isChartDisposed) {
            chartInstance.timeScale().fitContent();
          }
        }
      } catch (error) {
        console.error("Error updating chart:", error);
      } finally {
        if (isEffectActive) {
          setIsLoading(false);
        }
      }
    }, 500); // Simulate network delay

    return () => {
      // Mark effect as inactive
      isEffectActive = false;
      clearTimeout(timeoutId);

      // Clean up series to prevent memory leaks
      if (seriesInstance && chartInstance && !isChartDisposed) {
        try {
          chartInstance.removeSeries(seriesInstance);
        } catch (error) {
          console.error("Error cleaning up series on effect cleanup:", error);
        }
      }
    };
  }, [chartInstance, chartType, symbol, timeFrame, isChartDisposed]);

  // Form submission handler for trade execution
  const handleTrade = async (values: any) => {
    setExecuting(true);

    // Simulate API call to execute trade
    setTimeout(() => {
      message.success(
        `${tradeType.toUpperCase()} order executed successfully for ${symbol} at $${currentPrice.toFixed(
          2
        )}`
      );
      setExecuting(false);
      form.resetFields(["amount", "stopLoss", "takeProfit"]);
    }, 1500);
  };

  // Handle symbol click in the top bar
  const handleSymbolClick = (symbolName: string) => {
    // If clicking the same symbol, don't navigate to prevent re-renders
    if (symbolName === symbol) return;

    try {
      // Set disposed flag to prevent further operations
      setIsChartDisposed(true);

      // Wait a moment before navigating to ensure proper cleanup
      requestAnimationFrame(() => {
        // Navigate to the new symbol
        navigate(`/trading-view/${symbolName}`);
      });
    } catch (error) {
      console.error("Error navigating to symbol:", error);
      // Try basic navigation if the above fails
      navigate(`/trading-view/${symbolName}`);
    }
  };

  if (!symbol) {
    return <div>Symbol not specified</div>;
  }

  const calculatePipValue = (amount: number, leverage: number) => {
    // Simple pip value calculation - would be different for each instrument type
    return ((amount * leverage) / 10000).toFixed(2);
  };

  const showTrading = isForexSymbol(symbol);

  return (
    <div className="trading-dark-theme" style={{ padding: "0px" }}>
      {/* Top symbols bar */}
      <div className="top-symbols-bar">
        {POPULAR_SYMBOLS.map((item, index) => (
          <div
            key={index}
            className="symbol-item"
            onClick={() => handleSymbolClick(item.symbol)}
          >
            <span className="symbol-name">{item.symbol}</span>
            <span
              className={`symbol-price ${item.change >= 0 ? "up" : "down"}`}
            >
              {item.price.toFixed(item.price < 100 ? 4 : 2)}{" "}
              <small>
                {item.change >= 0 ? "+" : ""}
                {item.change}%
              </small>
            </span>
          </div>
        ))}
      </div>

      <Row gutter={16}>
        {/* Left sidebar - Symbol list */}
        <Col xs={24} sm={6} lg={5}>
          <div className="side-panel" style={{ marginBottom: "16px" }}>
            <div className="side-panel-header">Instruments</div>
            <div style={{ padding: "8px" }}>
              <Input
                placeholder="Search symbols..."
                prefix={<SearchOutlined />}
                className="symbol-search-input"
              />
            </div>
            <div style={{ height: "400px", overflowY: "auto" }}>
              <div className="symbol-list">
                {POPULAR_SYMBOLS.map((item, index) => (
                  <div
                    key={index}
                    className={`symbol-list-item ${
                      item.symbol === symbol ? "active" : ""
                    }`}
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      background:
                        item.symbol === symbol ? "#2a2e39" : "transparent",
                      cursor: "pointer",
                    }}
                    onClick={() => handleSymbolClick(item.symbol)}
                  >
                    <span>{item.symbol}</span>
                    <span className={item.change >= 0 ? "up" : "down"}>
                      {item.price.toFixed(item.price < 100 ? 4 : 2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Account info */}
          <div className="side-panel">
            <div className="side-panel-header">Account</div>
            <div style={{ padding: "16px" }}>
              <div className="price-indicator">
                <span className="label">Balance</span>
                <span className="value">${balance.toFixed(2)}</span>
              </div>
              <div className="price-indicator">
                <span className="label">Equity</span>
                <span className="value">${balance.toFixed(2)}</span>
              </div>
              <div className="price-indicator">
                <span className="label">Margin</span>
                <span className="value">$0.00</span>
              </div>
              <div className="price-indicator">
                <span className="label">Free Margin</span>
                <span className="value">${balance.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Col>

        {/* Main content area */}
        <Col xs={24} sm={18} lg={14}>
          <Card className="trading-card" bordered={false}>
            {/* Chart header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "16px",
                alignItems: "center",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Text strong style={{ color: "#d1d4dc", fontSize: "16px" }}>
                  {symbol}
                </Text>
                {currentPrice > 0 && (
                  <Text style={{ color: "#d1d4dc" }}>
                    {currentPrice.toFixed(currentPrice < 100 ? 4 : 2)}
                    <Tag
                      color={tradeType === "buy" ? "success" : "error"}
                      style={{ marginLeft: "8px" }}
                    >
                      {tradeType === "buy" ? "+" : "-"}
                      {0.42}%
                    </Tag>
                  </Text>
                )}
              </div>

              <Space>
                <Select
                  value={timeFrame}
                  onChange={(value) => setTimeFrame(value as TimeFrame)}
                  style={{ width: 70 }}
                  dropdownStyle={{
                    backgroundColor: "#1e222d",
                    color: "#d1d4dc",
                  }}
                >
                  <Option value="1m">1m</Option>
                  <Option value="5m">5m</Option>
                  <Option value="15m">15m</Option>
                  <Option value="30m">30m</Option>
                  <Option value="1h">1H</Option>
                  <Option value="4h">4H</Option>
                  <Option value="1D">1D</Option>
                  <Option value="1W">1W</Option>
                </Select>

                <Select
                  value={chartType}
                  onChange={(value) => setChartType(value as ChartType)}
                  style={{ width: 120 }}
                  dropdownStyle={{
                    backgroundColor: "#1e222d",
                    color: "#d1d4dc",
                  }}
                >
                  <Option value="candles">Candlestick</Option>
                  <Option value="line">Line</Option>
                  <Option value="area">Area</Option>
                </Select>
              </Space>
            </div>

            {/* Chart container */}
            <div
              ref={chartContainerRef}
              className="tradingview-container"
              style={{ marginBottom: "16px" }}
            >
              {isLoading && (
                <div className="loading-overlay">
                  <Spin size="large" />
                </div>
              )}
            </div>
          </Card>

          {/* Open positions placeholder */}
          <Card
            className="trading-card"
            title="Open Positions"
            bordered={false}
            style={{ marginTop: "16px" }}
          >
            <div
              style={{ padding: "16px", textAlign: "center", color: "#848e9c" }}
            >
              No open positions
            </div>
          </Card>
        </Col>

        {/* Right sidebar - Trading panel */}
        <Col xs={24} sm={24} lg={5}>
          <div className="order-panel">
            <Tabs defaultActiveKey="trade" className="trading-tabs">
              <TabPane tab="Trade" key="trade">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleTrade}
                  initialValues={{
                    amount: 0.01,
                    leverage: 50,
                    stopLoss: currentPrice * 0.99,
                    takeProfit: currentPrice * 1.01,
                  }}
                >
                  <div className="trade-type-selector">
                    <Radio.Group
                      value={tradeType}
                      onChange={(e) => setTradeType(e.target.value)}
                      buttonStyle="solid"
                      style={{ width: "100%", display: "flex" }}
                    >
                      <Radio.Button
                        value="buy"
                        className="buy-button"
                        style={{ flex: 1, textAlign: "center" }}
                      >
                        Buy
                      </Radio.Button>
                      <Radio.Button
                        value="sell"
                        className="sell-button"
                        style={{ flex: 1, textAlign: "center" }}
                      >
                        Sell
                      </Radio.Button>
                    </Radio.Group>
                  </div>

                  <div style={{ marginTop: "16px" }}>
                    <div className="order-tabs">
                      <div
                        className={`order-tab ${
                          orderType === "market" ? "active" : ""
                        }`}
                        onClick={() => setOrderType("market")}
                      >
                        Market
                      </div>
                      <div
                        className={`order-tab ${
                          orderType === "limit" ? "active" : ""
                        }`}
                        onClick={() => setOrderType("limit")}
                      >
                        Limit
                      </div>
                      <div
                        className={`order-tab ${
                          orderType === "stop" ? "active" : ""
                        }`}
                        onClick={() => setOrderType("stop")}
                      >
                        Stop
                      </div>
                    </div>
                  </div>

                  {orderType !== "market" && (
                    <Form.Item
                      label={<span className="order-label">Price</span>}
                      name="price"
                    >
                      <InputNumber
                        className="order-input"
                        style={{ width: "100%" }}
                        precision={currentPrice < 100 ? 4 : 2}
                        defaultValue={currentPrice}
                      />
                    </Form.Item>
                  )}

                  <Form.Item
                    label={<span className="order-label">Volume</span>}
                    name="amount"
                  >
                    <InputNumber
                      className="order-input"
                      style={{ width: "100%" }}
                      min={0.01}
                      max={10}
                      step={0.01}
                      precision={2}
                    />
                  </Form.Item>

                  <Form.Item
                    label={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <span className="order-label">Stop Loss</span>
                        <span className="order-label" style={{ opacity: 0.7 }}>
                          {tradeType === "buy" ? "-" : "+"}
                          {calculatePipValue(
                            form.getFieldValue("amount") || 0.01,
                            50
                          )}{" "}
                          / pip
                        </span>
                      </div>
                    }
                    name="stopLoss"
                  >
                    <InputNumber
                      className="order-input"
                      style={{ width: "100%" }}
                      precision={currentPrice < 100 ? 4 : 2}
                    />
                  </Form.Item>

                  <Form.Item
                    label={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <span className="order-label">Take Profit</span>
                        <span className="order-label" style={{ opacity: 0.7 }}>
                          {tradeType === "buy" ? "+" : "-"}
                          {calculatePipValue(
                            form.getFieldValue("amount") || 0.01,
                            50
                          )}{" "}
                          / pip
                        </span>
                      </div>
                    }
                    name="takeProfit"
                  >
                    <InputNumber
                      className="order-input"
                      style={{ width: "100%" }}
                      precision={currentPrice < 100 ? 4 : 2}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginTop: "24px" }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      block
                      loading={executing}
                      className={
                        tradeType === "buy" ? "buy-button" : "sell-button"
                      }
                    >
                      {tradeType === "buy" ? "Buy" : "Sell"} {symbol}
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>

              <TabPane tab="Market" key="market">
                <div
                  style={{
                    height: "300px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#848e9c",
                  }}
                >
                  Market depth information will appear here
                </div>
              </TabPane>
            </Tabs>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default TradingViewSymbol;
