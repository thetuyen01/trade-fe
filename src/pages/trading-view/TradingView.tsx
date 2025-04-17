import { useState, useEffect } from "react";
import { Card, List, Button, Typography, Space, Tabs, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import "./TradingView.css";

const { Title } = Typography;
const { TabPane } = Tabs;

type SymbolType = {
  symbol: string;
  name: string;
  type: string;
};

type CategoryKey = "forex" | "crypto" | "stocks";

// Trading symbols by category
const TRADING_SYMBOLS: Record<CategoryKey, SymbolType[]> = {
  forex: [
    { symbol: "EURUSD", name: "Euro / US Dollar", type: "forex" },
    { symbol: "GBPUSD", name: "British Pound / US Dollar", type: "forex" },
    { symbol: "USDJPY", name: "US Dollar / Japanese Yen", type: "forex" },
    { symbol: "AUDUSD", name: "Australian Dollar / US Dollar", type: "forex" },
    { symbol: "USDCHF", name: "US Dollar / Swiss Franc", type: "forex" },
    { symbol: "USDCAD", name: "US Dollar / Canadian Dollar", type: "forex" },
    { symbol: "NZDUSD", name: "New Zealand Dollar / US Dollar", type: "forex" },
    { symbol: "EURGBP", name: "Euro / British Pound", type: "forex" },
  ],
  crypto: [
    { symbol: "BTCUSDT", name: "Bitcoin / USDT", type: "crypto" },
    { symbol: "ETHUSDT", name: "Ethereum / USDT", type: "crypto" },
    { symbol: "BNBUSDT", name: "Binance Coin / USDT", type: "crypto" },
    { symbol: "ADAUSDT", name: "Cardano / USDT", type: "crypto" },
    { symbol: "DOGEUSDT", name: "Dogecoin / USDT", type: "crypto" },
    { symbol: "XRPUSDT", name: "Ripple / USDT", type: "crypto" },
  ],
  stocks: [
    { symbol: "AAPL", name: "Apple Inc.", type: "stock" },
    { symbol: "MSFT", name: "Microsoft Corporation", type: "stock" },
    { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock" },
    { symbol: "AMZN", name: "Amazon.com, Inc.", type: "stock" },
    { symbol: "TSLA", name: "Tesla, Inc.", type: "stock" },
    { symbol: "META", name: "Meta Platforms, Inc.", type: "stock" },
  ],
};

export function TradingView() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("forex");
  const [symbols, setSymbols] = useState<SymbolType[]>(TRADING_SYMBOLS.forex);
  const navigate = useNavigate();

  // Update symbols when category changes
  useEffect(() => {
    setSymbols(TRADING_SYMBOLS[activeCategory]);
  }, [activeCategory]);

  const handleViewChart = (symbol: string) => {
    navigate(`/trading-view/${symbol}`);
  };

  const renderSymbolTag = (type: string) => {
    const colors: Record<string, string> = {
      forex: "blue",
      crypto: "green",
      stock: "orange",
    };

    return <Tag color={colors[type] || "default"}>{type.toUpperCase()}</Tag>;
  };

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Trading Dashboard</Title>

      <Tabs
        activeKey={activeCategory}
        onChange={(key) => setActiveCategory(key as CategoryKey)}
        className="trading-tabs"
      >
        <TabPane tab="Forex" key="forex" />
        <TabPane tab="Crypto" key="crypto" />
        <TabPane tab="Stocks" key="stocks" />
      </Tabs>

      <Card
        title={`${
          activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)
        } Trading Pairs`}
        extra={<span>Total: {symbols.length} pairs</span>}
      >
        <List
          itemLayout="horizontal"
          dataSource={symbols}
          renderItem={(item) => (
            <List.Item
              className="symbol-list-item"
              actions={[
                <Button
                  type="primary"
                  onClick={() => handleViewChart(item.symbol)}
                >
                  View Chart
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space size="middle">
                    {item.symbol}
                    {renderSymbolTag(item.type)}
                  </Space>
                }
                description={item.name}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

export default TradingView;
