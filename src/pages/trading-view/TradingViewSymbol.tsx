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
  Row,
  Col,
  Input,
  Tabs,
  Tag,
  Table,
  App,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import orderService, { Order } from "../../services/orderService";
import walletService from "../../services/walletService";
import "./TradingView.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Sample candle data - replace with actual API data
const generateSampleData = (symbol: string, days = 60) => {
  const data = [];
  const now = new Date();

  // Determine time interval based on the number of days
  let timeInterval: number;

  if (days <= 1) {
    // For intraday data, use minutes
    timeInterval = 60 * 1000; // 1 minute
  } else if (days <= 7) {
    // For up to a week, use hourly data
    timeInterval = 60 * 60 * 1000; // 1 hour
  } else if (days <= 30) {
    // For up to a month, use 4-hour data
    timeInterval = 4 * 60 * 60 * 1000; // 4 hours
  } else {
    // For longer periods, use daily data
    timeInterval = 24 * 60 * 60 * 1000; // 1 day
  }

  // Start price - random based on symbol to make each chart look different
  let price =
    (symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
      1000) +
    500;

  // Calculate starting timestamp based on days and time interval
  const startTime = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const dataPeriods = Math.floor(
    (now.getTime() - startTime.getTime()) / timeInterval
  );

  // Keep track of used timestamps to ensure uniqueness
  const usedTimestamps = new Set<string>();

  // Generate data points for each time interval
  for (let i = 0; i < dataPeriods; i++) {
    const date = new Date(startTime.getTime() + i * timeInterval);

    // Generate candle data with some randomness
    const volatility = price * 0.03;
    const open = price * (1 + (Math.random() * 0.02 - 0.01));
    const high = open * (1 + Math.random() * 0.02);
    const low = open * (1 - Math.random() * 0.02);
    const close =
      (open + high + low) / 3 + (Math.random() * volatility - volatility / 2);

    // Format the time in yyyy-mm-dd format for lightweight-charts compatibility
    let timeString = formatTimeForChart(
      date,
      timeInterval >= 24 * 60 * 60 * 1000 ? "1D" : "1h"
    );

    // Ensure the timestamp is unique
    if (usedTimestamps.has(timeString)) {
      // If this timestamp already exists, use a different day to ensure uniqueness
      const uniqueDate = new Date(date);
      uniqueDate.setDate(uniqueDate.getDate() + 1);
      timeString = formatTimeForChart(
        uniqueDate,
        timeInterval >= 24 * 60 * 60 * 1000 ? "1D" : "1h"
      );

      // If still a duplicate (extremely unlikely), add more days
      if (usedTimestamps.has(timeString)) {
        uniqueDate.setDate(
          uniqueDate.getDate() + Math.floor(Math.random() * 10) + 1
        );
        timeString = formatTimeForChart(
          uniqueDate,
          timeInterval >= 24 * 60 * 60 * 1000 ? "1D" : "1h"
        );
      }
    }

    // Add to used timestamps set
    usedTimestamps.add(timeString);

    data.push({
      time: timeString,
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

// Generate random price movement for real-time updates
const generatePriceUpdate = (lastPrice: number, volatility = 0.01) => {
  // Significantly increase volatility for more noticeable price movements
  const changePercent = (Math.random() - 0.5) * 2 * volatility;
  // Ensure we keep at least 4 decimal places of precision
  return Math.round(lastPrice * (1 + changePercent) * 10000) / 10000;
};

// Convert timestamp to lightweight-charts time format
const formatTimeForChart = (timestamp: Date, timeFrame: TimeFrame) => {
  // Format date part - lightweight-charts requires 'yyyy-mm-dd' format
  const year = timestamp.getFullYear();
  const month = (timestamp.getMonth() + 1).toString().padStart(2, "0");
  const day = timestamp.getDate().toString().padStart(2, "0");

  // Return date string in the format required by lightweight-charts
  return `${year}-${month}-${day}`;

  // NOTE: While lightweight-charts can support intraday timeframes,
  // the format must strictly be 'yyyy-mm-dd' or a UTC timestamp
};

export function TradingViewSymbol() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState<ChartType>("candles");
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1h");
  const [isLoading, setIsLoading] = useState(true);
  const [form] = Form.useForm();
  const { notification } = App.useApp();
  const [chartInstance, setChartInstance] = useState<IChartApi | null>(null);
  const [seriesInstance, setSeriesInstance] = useState<any>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [previousPrice, setPreviousPrice] = useState<number>(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const chartDataRef = useRef<any[]>([]);
  const [tradeType, setTradeType] = useState<TradeType>("buy");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [executing, setExecuting] = useState(false);
  const [balance, setBalance] = useState(10000);
  const [isChartDisposed, setIsChartDisposed] = useState(false);

  // New state for market orders and user orders
  const [marketOrders, setMarketOrders] = useState<Order[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Create a ref to store the resize handler
  const resizeHandlerRef = useRef<((event: UIEvent) => void) | null>(null);

  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [lastCandle, setLastCandle] = useState<any>(null);
  const priceUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const candleUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialPriceRef = useRef<number>(0);

  // When chartData updates, update the ref
  useEffect(() => {
    chartDataRef.current = chartData;
  }, [chartData]);

  // Fetch user wallet
  const fetchWallet = useCallback(async () => {
    try {
      const wallet = await walletService.getWallet();
      setBalance(wallet.balance);
    } catch (error) {
      console.error("Error fetching wallet:", error);
    }
  }, []);

  // Fetch market orders
  const fetchMarketOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const response = await orderService.getMarketOrders(1, 10);
      setMarketOrders(response.data);
    } catch (error) {
      console.error("Error fetching market orders:", error);
      notification.error({
        message: "Failed to load market orders",
      });
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // Fetch user orders
  const fetchUserOrders = useCallback(async () => {
    try {
      const response = await orderService.getUserOrders(1, 10);
      setUserOrders(response.data);
    } catch (error) {
      console.error("Error fetching user orders:", error);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    fetchWallet();
    fetchMarketOrders();
    fetchUserOrders();
  }, [fetchWallet, fetchMarketOrders, fetchUserOrders]);

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
    if (chartInstance && !isChartDisposed) {
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
          secondsVisible: timeFrame === "1m" || timeFrame === "5m", // Show seconds for smaller timeframes
          fixLeftEdge: false, // Allow chart to move as new data comes in
          fixRightEdge: false, // Allow chart to move as new data comes in
          rightOffset: 12, // Add some space to the right for incoming candles
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
        // Enable animations for a smoother feel
        handleScale: {
          axisPressedMouseMove: {
            time: true,
            price: true,
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

      // Clean up update intervals
      if (priceUpdateIntervalRef.current) {
        clearInterval(priceUpdateIntervalRef.current);
        priceUpdateIntervalRef.current = null;
      }

      if (candleUpdateIntervalRef.current) {
        clearInterval(candleUpdateIntervalRef.current);
        candleUpdateIntervalRef.current = null;
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
  }, [symbol, timeFrame]);

  // Update chart when chartType or timeFrame changes
  useEffect(() => {
    if (!chartInstance || !symbol || isChartDisposed) return;

    // Track if the effect is still active
    let isEffectActive = true;

    // Clear any existing update timers
    if (priceUpdateIntervalRef.current) {
      clearInterval(priceUpdateIntervalRef.current);
      priceUpdateIntervalRef.current = null;
    }

    if (candleUpdateIntervalRef.current) {
      clearInterval(candleUpdateIntervalRef.current);
      candleUpdateIntervalRef.current = null;
    }

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

        // Ensure data is properly sorted by time
        candleData.sort((a, b) => {
          const dateA = new Date(a.time).getTime();
          const dateB = new Date(b.time).getTime();
          return dateA - dateB;
        });

        // Ensure no duplicate timestamps in the initial data
        const timeMap = new Map();
        for (const candle of candleData) {
          timeMap.set(candle.time, candle);
        }
        const uniqueCandleData = Array.from(timeMap.values());

        if (isEffectActive) {
          setChartData(uniqueCandleData);
          const price = getCurrentPrice(uniqueCandleData);
          setCurrentPrice(price);

          // Initialize price change percent
          setPriceChangePercent(0);

          // Set the last candle reference for real-time updates
          if (uniqueCandleData.length > 0) {
            setLastCandle(uniqueCandleData[uniqueCandleData.length - 1]);
          }
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
          newSeries.setData(uniqueCandleData);
        } else if (chartType === "line") {
          newSeries = chartInstance.addSeries(LineSeries);
          newSeries.applyOptions({
            color: "#2962FF",
            lineWidth: 2,
            lastPriceAnimation: 1, // Enable price animation
          });
          // Convert candle data to line data
          const lineData = uniqueCandleData.map((item) => ({
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
            lastPriceAnimation: 1, // Enable price animation
          });
          // Convert candle data to line/area data
          const areaData = uniqueCandleData.map((item) => ({
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

            // Enable auto-scaling on the chart
            chartInstance.applyOptions({
              autoSize: true,
            });
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

      // Clean up intervals
      if (priceUpdateIntervalRef.current) {
        clearInterval(priceUpdateIntervalRef.current);
        priceUpdateIntervalRef.current = null;
      }

      if (candleUpdateIntervalRef.current) {
        clearInterval(candleUpdateIntervalRef.current);
        candleUpdateIntervalRef.current = null;
      }

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

  // Update price change calculation to be more stable
  const updatePriceChange = useCallback((newPrice: number) => {
    if (!initialPriceRef.current) {
      initialPriceRef.current = newPrice;
      return 0;
    }

    const change =
      ((newPrice - initialPriceRef.current) / initialPriceRef.current) * 100;
    return Number(change.toFixed(2));
  }, []);

  // Modified price update effect to use the new calculation
  useEffect(() => {
    if (!seriesInstance || !chartData.length || isChartDisposed) return;

    // Clear previous intervals if they exist
    if (priceUpdateIntervalRef.current) {
      clearInterval(priceUpdateIntervalRef.current);
    }

    if (candleUpdateIntervalRef.current) {
      clearInterval(candleUpdateIntervalRef.current);
    }

    let lastPrice = getCurrentPrice(chartData);
    let lastCandleData = chartData[chartData.length - 1];
    setLastCandle(lastCandleData);

    // Initialize our reference price for calculating change
    initialPriceRef.current = lastPrice;
    setPreviousPrice(lastPrice);

    // Ensure we have a price to work with
    if (!lastPrice) return;

    // Update price more frequently for more dynamic movement
    const priceInterval = setInterval(() => {
      if (isChartDisposed) {
        clearInterval(priceInterval);
        return;
      }

      // Generate new price with more noticeable movements (higher volatility)
      const volatility = 0.02; // Increased for more visible changes
      const directionBias = Math.random() > 0.5 ? 1 : -1; // Add some directional trend
      const changePercent = directionBias * (Math.random() * volatility);
      const newPrice =
        Math.round(lastPrice * (1 + changePercent) * 10000) / 10000;

      // Calculate percent change from the initial price
      const percentChange = updatePriceChange(newPrice);

      // Update UI states
      setCurrentPrice(newPrice);
      setPriceChangePercent(percentChange);
      setPreviousPrice(lastPrice); // Store the previous price

      // Update the last candle with new high/low/close as needed
      const updatedCandle = { ...lastCandleData };

      // Update high/low if price exceeds current values
      if (newPrice > updatedCandle.high) {
        updatedCandle.high = newPrice;
      }
      if (newPrice < updatedCandle.low) {
        updatedCandle.low = newPrice;
      }

      // Always update close price
      updatedCandle.close = newPrice;

      // Update the chart with new candle data
      try {
        if (seriesInstance && !isChartDisposed) {
          // For candlestick charts
          if (chartType === "candles") {
            seriesInstance.update(updatedCandle);
          } else {
            // For line and area charts
            seriesInstance.update({
              time: updatedCandle.time,
              value: newPrice,
            });
          }

          // Force the chart to repaint for better animation effect
          if (chartInstance) {
            chartInstance.timeScale().scrollToPosition(0, false);
          }
        }
      } catch (error) {
        console.error("Error updating price:", error);
      }

      // Store the updated values
      lastPrice = newPrice;
      lastCandleData = updatedCandle;
      setLastCandle(updatedCandle);
    }, 150); // Update price twice as frequently for more active movement

    // Create new candles at appropriate intervals based on timeframe
    const candleInterval = setInterval(
      () => {
        if (isChartDisposed || !seriesInstance) {
          clearInterval(candleInterval);
          return;
        }

        // Create a unique date that ensures sequential order and no duplicates
        // Basic principle: each new candle gets a date further in the future
        // Starting from today and incrementing by day for each candle
        const baseDate = new Date();

        // Get the latest chart data from the ref to avoid dependency issues
        const currentChartData = chartDataRef.current;

        // Get the last candle's time if available
        let nextDate: Date;
        if (currentChartData.length > 0) {
          // Get the latest candle by sorting the data
          const sortedData = [...currentChartData].sort((a, b) => {
            return new Date(b.time).getTime() - new Date(a.time).getTime();
          });

          const lastCandleTime = sortedData[0].time;
          // Create a date from the last candle's time string and add 1 day
          nextDate = new Date(lastCandleTime);

          // Get all existing timestamps
          const existingTimestamps = new Set(
            currentChartData.map((candle) => candle.time)
          );

          // Keep incrementing the date until we find a unique timestamp
          let potentialTimestamp = "";
          const maxAttempts = 100; // Prevent infinite loops
          let attempts = 0;

          while (attempts < maxAttempts) {
            nextDate.setDate(nextDate.getDate() + 1);
            potentialTimestamp = formatTimeForChart(nextDate, timeFrame);
            if (!existingTimestamps.has(potentialTimestamp)) {
              break;
            }
            attempts++;
          }
        } else {
          // If no chart data exists yet, use today + 1 day
          nextDate = new Date(baseDate);
          nextDate.setDate(baseDate.getDate() + 1);
        }

        // Format time string in yyyy-mm-dd format as required by lightweight-charts
        const newTime = formatTimeForChart(nextDate, timeFrame);

        // Generate a more dynamic price for the new candle
        const openPrice = lastPrice;
        const volatility = 0.015; // Higher volatility for more visible changes
        const highPrice = openPrice * (1 + Math.random() * volatility);
        const lowPrice = openPrice * (1 - Math.random() * volatility);
        const closePrice =
          (openPrice + highPrice + lowPrice) / 3 +
          (Math.random() * openPrice * 0.01 - openPrice * 0.005);

        // Create a new candle with dynamic OHLC values
        const newCandle = {
          time: newTime,
          open: openPrice,
          high: Math.max(highPrice, openPrice, closePrice),
          low: Math.min(lowPrice, openPrice, closePrice),
          close: closePrice,
        };

        // Add the new candle
        try {
          // Create a set of existing timestamps for faster lookup
          const existingTimestamps = new Set(
            currentChartData.map((candle) => candle.time)
          );

          // Check if we already have a candle with this timestamp
          if (existingTimestamps.has(newTime)) {
            // If we have a duplicate, create a guaranteed unique timestamp
            // by adding one more day to the already incremented date
            const baseDate = new Date();
            const dataLength = currentChartData ? currentChartData.length : 0;
            const guaranteedUniqueDate = new Date(baseDate);
            guaranteedUniqueDate.setDate(baseDate.getDate() + dataLength + 2);

            // Use this guaranteed unique time
            newCandle.time = formatTimeForChart(
              guaranteedUniqueDate,
              timeFrame
            );
          }

          // Create a new array with the latest candle
          const updatedChartData = [...currentChartData, newCandle];

          // Keep only the most recent 100 candles to prevent performance issues and ensure they're sorted
          const finalChartData = updatedChartData.slice(-100).sort((a, b) => {
            // Convert string dates to numeric timestamps for reliable comparison
            // Properly parse yyyy-mm-dd formatted dates
            const dateA = new Date(a.time).getTime();
            const dateB = new Date(b.time).getTime();
            return dateA - dateB;
          });

          // Remove duplicate timestamps - keep only the last entry for each timestamp
          const timeMap = new Map();

          // Group by timestamp, keeping the last entry for each
          for (const candle of finalChartData) {
            timeMap.set(candle.time, candle);
          }

          // Convert map values back to array
          const uniqueData = Array.from(timeMap.values());

          // Sort again to ensure ascending order
          uniqueData.sort((a, b) => {
            const dateA = new Date(a.time).getTime();
            const dateB = new Date(b.time).getTime();
            return dateA - dateB;
          });

          // Update the chart with the deduplicated dataset
          if (chartType === "candles") {
            seriesInstance.setData(uniqueData);
          } else {
            // For line and area charts
            const lineData = uniqueData.map((item) => ({
              time: item.time,
              value: item.close,
            }));
            seriesInstance.setData(lineData);
          }

          // Update state with the new data - this will trigger a re-render
          // But use a reference equality check to avoid infinite loops
          setChartData((prevData) => {
            // Only update if the data is actually different
            if (JSON.stringify(prevData) === JSON.stringify(uniqueData)) {
              return prevData; // Return the same reference to avoid re-render
            }
            return uniqueData;
          });

          lastPrice = closePrice;
          lastCandleData = newCandle;
          setLastCandle(newCandle);
          setCurrentPrice(closePrice);
          setPreviousPrice(openPrice);
          setPriceChangePercent(
            Number((((closePrice - openPrice) / openPrice) * 100).toFixed(2))
          );

          // Force the chart to show the latest data
          if (chartInstance) {
            chartInstance.timeScale().scrollToPosition(0, false);
          }
        } catch (error) {
          console.error("Error adding new candle:", error);
        }
      },
      // Significantly shorter intervals for demo purposes
      timeFrame === "1m"
        ? 2000 // Much faster update
        : timeFrame === "5m"
        ? 3000
        : timeFrame === "15m"
        ? 4000
        : timeFrame === "30m"
        ? 5000
        : timeFrame === "1h"
        ? 6000
        : timeFrame === "4h"
        ? 7000
        : timeFrame === "1D"
        ? 8000
        : 10000
    );

    // Store the intervals for cleanup
    priceUpdateIntervalRef.current = priceInterval;
    candleUpdateIntervalRef.current = candleInterval;

    return () => {
      clearInterval(priceInterval);
      clearInterval(candleInterval);
      priceUpdateIntervalRef.current = null;
      candleUpdateIntervalRef.current = null;
    };
  }, [
    seriesInstance,
    chartType,
    timeFrame,
    isChartDisposed,
    updatePriceChange,
    chartInstance,
  ]); // Do not include refs like chartDataRef in the dependency array

  // Clean up intervals when component unmounts
  useEffect(() => {
    return () => {
      if (priceUpdateIntervalRef.current) {
        clearInterval(priceUpdateIntervalRef.current);
      }
      if (candleUpdateIntervalRef.current) {
        clearInterval(candleUpdateIntervalRef.current);
      }
    };
  }, []);

  // Form submission handler for trade execution
  const handleTrade = async (values: any) => {
    setExecuting(true);

    try {
      const orderData = {
        type: tradeType.toUpperCase() as "BUY" | "SELL",
        amount: values.amount,
        price: orderType === "market" ? currentPrice : values.price,
      };

      const response = await orderService.createOrder(orderData);

      if (response.status === 201) {
        notification.success({
          message: response.message,
        });
        fetchUserOrders();
        fetchWallet();

        form.resetFields(["amount", "stopLoss", "takeProfit"]);
      } else {
        notification.error({
          message: response.message,
        });
      }
    } catch (error) {
      // Refresh user orders and wallet
      console.error("Error creating order:", error);
      notification.error({
        message: "Failed to create order",
      });
    } finally {
      setExecuting(false);
    }
  };

  // Handle executing a market order
  const handleExecuteOrder = async (orderId: number) => {
    try {
      await orderService.executeOrder(orderId);

      notification.success({
        message: "Order executed successfully",
      });

      // Refresh orders and wallet
      fetchMarketOrders();
      fetchUserOrders();
      fetchWallet();
    } catch (error) {
      console.error("Error executing order:", error);
      notification.error({
        message: "Failed to execute order",
      });
    }
  };

  // Handle canceling an order
  const handleCancelOrder = async (orderId: number) => {
    try {
      await orderService.cancelOrder(orderId);

      notification.success({
        message: "Order canceled successfully",
      });

      // Refresh orders and wallet
      fetchUserOrders();
      fetchWallet();
    } catch (error) {
      console.error("Error canceling order:", error);
      notification.error({
        message: "Failed to cancel order",
      });
    }
  };

  // Handle symbol click in the top bar
  const handleSymbolClick = (symbolName: string) => {
    // If clicking the same symbol, don't navigate to prevent re-renders
    if (symbolName === symbol) return;

    try {
      // First, mark as disposed to prevent further operations
      setIsChartDisposed(true);

      // Clear the instance states first
      setChartInstance(null);
      setSeriesInstance(null);

      // After state updates and disposal flag, try removing the chart
      if (chartInstance) {
        try {
          // Delay chart removal slightly to ensure state updates have propagated
          setTimeout(() => {
            try {
              if (chartInstance) {
                chartInstance.remove();
              }
            } catch (error) {
              // Silently catch errors during delayed removal
              console.debug("Chart already disposed during cleanup");
            }
          }, 10);
        } catch (error) {
          console.error("Error during chart cleanup:", error);
        }
      }

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

  // Market orders table columns
  const marketOrdersColumns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={type === "BUY" ? "green" : "red"}>{type}</Tag>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price: number) => price.toFixed(2),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => amount.toFixed(4),
    },
    {
      title: "Total",
      key: "total",
      render: (record: Order) => (record.price * record.amount).toFixed(2),
    },
    {
      title: "Action",
      key: "action",
      render: (record: Order) => (
        <Button
          size="small"
          type="primary"
          onClick={() => handleExecuteOrder(record.id)}
        >
          Execute
        </Button>
      ),
    },
  ];

  // User orders table columns
  const userOrdersColumns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={type === "BUY" ? "green" : "red"}>{type}</Tag>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price: number) => price.toFixed(2),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => amount.toFixed(4),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag
          color={
            status === "OPEN"
              ? "blue"
              : status === "COMPLETED"
              ? "green"
              : "red"
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (record: Order) =>
        record.status === "OPEN" && (
          <Button
            size="small"
            danger
            onClick={() => handleCancelOrder(record.id)}
          >
            Cancel
          </Button>
        ),
    },
  ];

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
                    <span
                      className={
                        previousPrice && currentPrice > previousPrice
                          ? "price-up"
                          : previousPrice && currentPrice < previousPrice
                          ? "price-down"
                          : ""
                      }
                    >
                      {currentPrice.toFixed(currentPrice < 100 ? 4 : 2)}
                    </span>
                    <Tag
                      color={priceChangePercent >= 0 ? "success" : "error"}
                      style={{ marginLeft: "8px" }}
                    >
                      {priceChangePercent >= 0 ? "+" : ""}
                      {priceChangePercent}%
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

          {/* User orders table */}
          <Card
            className="trading-card"
            title="Your Orders"
            bordered={false}
            style={{ marginTop: "16px" }}
            extra={
              <Button
                type="primary"
                size="small"
                onClick={fetchUserOrders}
                icon={<SearchOutlined />}
              >
                Refresh
              </Button>
            }
          >
            <Table
              dataSource={userOrders}
              columns={userOrdersColumns}
              size="small"
              pagination={false}
              rowKey="id"
              locale={{ emptyText: "No orders yet" }}
            />
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
                    rules={[
                      { required: true, message: "Please enter an amount" },
                      {
                        type: "number",
                        min: 0.01,
                        message: "Minimum amount is 0.01",
                      },
                    ]}
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
                <Table
                  dataSource={marketOrders}
                  columns={marketOrdersColumns}
                  size="small"
                  pagination={false}
                  rowKey="id"
                  loading={loadingOrders}
                  locale={{ emptyText: "No market orders available" }}
                />
                <div style={{ marginTop: "10px", textAlign: "center" }}>
                  <Button
                    type="primary"
                    size="small"
                    onClick={fetchMarketOrders}
                  >
                    Refresh Market
                  </Button>
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
