import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const ReportDownload = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="glass border-primary/20 bg-primary/5 mb-8 no-print">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          <CardTitle>Keep this memory</CardTitle>
        </div>
        <CardDescription>
          Download a localized PDF copy of your chat analysis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handlePrint} className="w-full sm:w-auto gap-2">
          <Download className="w-4 h-4" />
          Download PDF Report
        </Button>
      </CardContent>
    </Card>
  );
};
