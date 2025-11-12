import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SimpleAISearch from "./components/SimpleAISearch";
import EnhancedAISearch from "./components/EnhancedAISearch";
import FixedAISearch from "./components/FixedAISearch";
import EnhancedMetroDashboard from "./components/EnhancedMetroDashboard";
import NavigationHeader from "./components/NavigationHeader";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <div className="min-h-screen relative overflow-hidden">
      <Toaster position="top-right" />
      <BrowserRouter>
        <NavigationHeader />
        <Routes>
          <Route path="/" element={<FixedAISearch />} />
          <Route path="/simple" element={<SimpleAISearch />} />
          <Route path="/enhanced" element={<EnhancedAISearch />} />
          <Route path="/fixed" element={<FixedAISearch />} />
          <Route path="/dashboard" element={<EnhancedMetroDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  </QueryClientProvider>
);

export default App;
