import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, Plus, GripVertical } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { apiActions } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/lead-forms/create")({
  component: CreateLeadFormPage,
});

const FIELD_DEFAULTS = [
  { id: "name", label: "Full Name", placeholder: "Your Full Name", required: true, showLabel: true },
  { id: "phone", label: "Phone Number", placeholder: "+234...", required: true, showLabel: true },
  { id: "whatsapp", label: "WhatsApp Number", placeholder: "+234...", required: true, showLabel: true },
  { id: "email", label: "Email", placeholder: "you@example.com", required: true, showLabel: true },
  { id: "address", label: "Delivery Address", placeholder: "Street, city", required: true, showLabel: true },
  { id: "state", label: "State", placeholder: "Select your state", required: true, showLabel: true },
  { id: "package", label: "Select your package", placeholder: "", required: true, showLabel: true },
];

function CreateLeadFormPage() {
  const navigate = useNavigate();

  // Load products to populate dropdowns
  const { data: productsData } = useQuery({
    queryKey: ["inventory-products"],
    queryFn: async () => (await apiActions.inventory.products()).data,
  });
  const products: any[] = Array.isArray(productsData) ? productsData : productsData?.data || [];

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fields, setFields] = useState(FIELD_DEFAULTS);

  // 1. Basics
  const [name, setName] = useState("Untitled Form");
  const [productId, setProductId] = useState("");
  const [branch, setBranch] = useState("Megadeals (HQ)");
  const [priorityStates, setPriorityStates] = useState("");
  const [headline, setHeadline] = useState("Order now");
  const [subHeadline, setSubHeadline] = useState("Fast delivery, secure checkout.");
  const [submitLabel, setSubmitLabel] = useState("Place My Order");
  const [preSubmitText, setPreSubmitText] = useState("Important Notice: Only place this order if you are certain you want this product and will be available to receive and pay for it within 3 days of ordering.\n\nDo not order if you are travelling, unavailable or unsure.");
  const [postSubmitText, setPostSubmitText] = useState("Free Delivery + Pay After Delivery");
  const [footerText, setFooterText] = useState("© {{year}} All Rights Reserved.");
  const [thankYouUrl, setThankYouUrl] = useState("");

  // 2. Styling
  const [buttonColor, setButtonColor] = useState("#000000");
  const [textColor, setTextColor] = useState("#ffffff");

  // 5. Phone Settings
  const [showPhoneCode, setShowPhoneCode] = useState(true);
  const [showWhatsappCode, setShowWhatsappCode] = useState(true);

  // 7. Order Bump
  const [bumpProduct, setBumpProduct] = useState("");
  const [bumpHeader, setBumpHeader] = useState("Would You Like To Add To Your Order:");
  const [bumpBenefit, setBumpBenefit] = useState("");
  const [bumpScarcity, setBumpScarcity] = useState("This offer is not available at ANY other time or place");
  const [bumpCheckbox, setBumpCheckbox] = useState("Yes, I will Take It");
  const [bumpBg, setBumpBg] = useState("#FEF3C7");
  const [bumpTextCol, setBumpTextCol] = useState("#111827");

  // 8. Upsell
  const [upsellProduct, setUpsellProduct] = useState("");
  const [upsellUrl, setUpsellUrl] = useState("");
  const [upsellBtnText, setUpsellBtnText] = useState("Add to my order");
  const [upsellDecline, setUpsellDecline] = useState("No I don't want this huge give-away discount");
  const [upsellScarcity, setUpsellScarcity] = useState("PS: you won't see this insane discount ever again once you close this page");

  // 9. Commitment Fee
  const [commitmentFee, setCommitmentFee] = useState("0");

  // 12. Invoice
  const [invoiceFooter, setInvoiceFooter] = useState("VAT 7.5% Incl.");
  const [receiptFooter, setReceiptFooter] = useState("Goods delivered in good condition cannot be returned");

  // 13. Notifications
  const [notifyEmails, setNotifyEmails] = useState("");

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // In a real scenario, you'd send ALL these fields to the API.
      // Currently our mock API just expects these:
      await apiActions.leadForms.create({
        title: name,
        productId,
        primaryColor: buttonColor,
        submitButtonText: submitLabel,
        defaultSource: "FACEBOOK",
      });
      toast.success("Form saved successfully");
      navigate({ to: "/lead-forms" });
    } catch (e: any) {
      toast.error(e.friendlyMessage || "Failed to save form");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/lead-forms" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">New Form</h1>
            <p className="text-sm text-muted-foreground">Configure your lead capture form</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSubmitting || !name || !productId}>
          {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Form
        </Button>
      </div>

      <div className="grid gap-6">
        {/* 1. Basics */}
        <Card>
          <CardHeader>
            <CardTitle>1 · Basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Form name*</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Untitled Form" />
              </div>
              <div className="space-y-2">
                <Label>Tied product*</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id || p._id} value={p.id || p._id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Megadeals (HQ)">Megadeals (HQ)</SelectItem>
                  <SelectItem value="Lagos Branch">Lagos Branch</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Leave on HQ to auto-route orders to the branch matching the customer's country.</p>
            </div>

            <div className="space-y-2">
              <Label>State display order (priority)</Label>
              <Textarea value={priorityStates} onChange={e => setPriorityStates(e.target.value)} placeholder="e.g. Lagos, Abuja, Rivers" />
              <p className="text-xs text-muted-foreground">States listed here appear at the top of the dropdown. All other states follow alphabetically.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Headline</Label>
                <Input value={headline} onChange={e => setHeadline(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sub-headline</Label>
                <Input value={subHeadline} onChange={e => setSubHeadline(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Submit button label*</Label>
              <Input value={submitLabel} onChange={e => setSubmitLabel(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Text before submit button</Label>
              <Textarea value={preSubmitText} onChange={e => setPreSubmitText(e.target.value)} rows={4} />
            </div>

            <div className="space-y-2">
              <Label>Text after submit button</Label>
              <Input value={postSubmitText} onChange={e => setPostSubmitText(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Footer text</Label>
              <Input value={footerText} onChange={e => setFooterText(e.target.value)} />
              <p className="text-xs text-muted-foreground">Use {'{{year}}'} to insert the current year automatically.</p>
            </div>

            <div className="space-y-2">
              <Label>Thank you URL*</Label>
              <Input value={thankYouUrl} onChange={e => setThankYouUrl(e.target.value)} placeholder="https://..." />
            </div>
          </CardContent>
        </Card>

        {/* 2. Styling */}
        <Card>
          <CardHeader><CardTitle>2 · Form styling</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Button Color</Label>
              <div className="flex gap-2">
                <Input type="color" className="w-12 h-10 p-1" value={buttonColor} onChange={e => setButtonColor(e.target.value)} />
                <Input value={buttonColor} onChange={e => setButtonColor(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Button Text Color</Label>
              <div className="flex gap-2">
                <Input type="color" className="w-12 h-10 p-1" value={textColor} onChange={e => setTextColor(e.target.value)} />
                <Input value={textColor} onChange={e => setTextColor(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Price points */}
        <Card>
          <CardHeader><CardTitle>3 · Price points</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Configure pricing variations and packages for this form.</p>
            <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" /> Add Price Point</Button>
          </CardContent>
        </Card>

        {/* 4. Form fields */}
        <Card>
          <CardHeader>
            <CardTitle>4 · Form fields</CardTitle>
            <CardDescription>Drag the handle to reorder fields.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, idx) => (
              <div key={field.id} className="border border-border rounded-md p-4 bg-muted/20">
                <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                  <div className="flex items-center font-medium text-sm">
                    <GripVertical className="h-4 w-4 mr-2 text-muted-foreground cursor-grab" />
                    {field.id} · required
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Label</Label>
                    <Input value={field.label} onChange={(e) => {
                      const newF = [...fields]; newF[idx].label = e.target.value; setFields(newF);
                    }} />
                  </div>
                  <div className="space-y-2">
                    <Label>Placeholder</Label>
                    <Input value={field.placeholder} onChange={(e) => {
                      const newF = [...fields]; newF[idx].placeholder = e.target.value; setFields(newF);
                    }} />
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Switch checked={field.required} onCheckedChange={(val) => {
                      const newF = [...fields]; newF[idx].required = val; setFields(newF);
                    }} />
                    <Label className="text-xs">Required</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={field.showLabel} onCheckedChange={(val) => {
                      const newF = [...fields]; newF[idx].showLabel = val; setFields(newF);
                    }} />
                    <Label className="text-xs">Show label (off → use placeholder)</Label>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" /> Add Custom Field</Button>
          </CardContent>
        </Card>

        {/* 5. Phone Settings */}
        <Card>
          <CardHeader><CardTitle>5 · Phone settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <Label>Show country code dropdown before Phone field</Label>
              <Switch checked={showPhoneCode} onCheckedChange={setShowPhoneCode} />
            </div>
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <Label>Show country code dropdown before WhatsApp field</Label>
              <Switch checked={showWhatsappCode} onCheckedChange={setShowWhatsappCode} />
            </div>
            <p className="text-xs text-muted-foreground">Default selected code is from the tied product's country (e.g. NG +234).</p>
          </CardContent>
        </Card>

        {/* 6. Delivery & Coupons */}
        <Card>
          <CardHeader><CardTitle>6 · Delivery Fee, Coupon & Discount</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Delivery fee set</Label>
              <Select defaultValue="none"><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-2">
              <Label>Coupon / discount code</Label>
              <Select defaultValue="none"><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem></SelectContent></Select>
            </div>
          </CardContent>
        </Card>

        {/* 7. Order Bumps */}
        <Card>
          <CardHeader><CardTitle>7 · Order bumps</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-border rounded-md p-4 space-y-4 bg-amber-50/30">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Order bump product</Label>
                  <Select value={bumpProduct} onValueChange={setBumpProduct}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{products.map(p => <SelectItem key={p.id||p._id} value={p.id||p._id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Header</Label>
                  <Input value={bumpHeader} onChange={e => setBumpHeader(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Biggest benefit</Label>
                  <Input value={bumpBenefit} onChange={e => setBumpBenefit(e.target.value)} placeholder="Melts Away Fats In 2 Days!" />
                </div>
                <div className="space-y-2">
                  <Label>Scarcity text</Label>
                  <Input value={bumpScarcity} onChange={e => setBumpScarcity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Checkbox CTA</Label>
                  <Input value={bumpCheckbox} onChange={e => setBumpCheckbox(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Section background</Label>
                  <div className="flex gap-2">
                    <Input type="color" className="w-12 h-10 p-1" value={bumpBg} onChange={e => setBumpBg(e.target.value)} />
                    <Input value={bumpBg} onChange={e => setBumpBg(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" /> Add Order Bump</Button>
          </CardContent>
        </Card>

        {/* 8. Upsells */}
        <Card>
          <CardHeader>
            <CardTitle>8 · Upsells</CardTitle>
            <CardDescription>After main submit → first upsell page → next upsell → ... → thank-you URL.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-border rounded-md p-4 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Upsell product</Label>
                  <Select value={upsellProduct} onValueChange={setUpsellProduct}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{products.map(p => <SelectItem key={p.id||p._id} value={p.id||p._id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Upsell page full URL</Label>
                  <Input value={upsellUrl} onChange={e => setUpsellUrl(e.target.value)} placeholder="https://" />
                </div>
                <div className="space-y-2">
                  <Label>Button text</Label>
                  <Input value={upsellBtnText} onChange={e => setUpsellBtnText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Decline offer text</Label>
                  <Input value={upsellDecline} onChange={e => setUpsellDecline(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Scarcity text</Label>
                  <Input value={upsellScarcity} onChange={e => setUpsellScarcity(e.target.value)} />
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" /> Add Upsell</Button>
          </CardContent>
        </Card>

        {/* 9. Commitment fee */}
        <Card>
          <CardHeader><CardTitle>9 · Commitment fee</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Commitment fee (₦)</Label>
              <Input type="number" value={commitmentFee} onChange={e => setCommitmentFee(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>States excluded</Label>
              <Select><SelectTrigger><SelectValue placeholder="Choose states" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem></SelectContent></Select>
            </div>
          </CardContent>
        </Card>

        {/* 10. Terms & Conditions */}
        <Card>
          <CardHeader><CardTitle>10 · Terms & Conditions</CardTitle></CardHeader>
          <CardContent>
            <Textarea placeholder="Enter terms and conditions text..." rows={4} />
          </CardContent>
        </Card>

        {/* 11. Integrations */}
        <Card>
          <CardHeader><CardTitle>11 · Integrations</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Email Services</h4>
              <p className="text-xs text-muted-foreground">Choose one email service for sending invoices and notifications.</p>
              <Select defaultValue="sniper"><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="sniper">Sniper Email Service (Built-in)</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Google Sheets</h4>
              <p className="text-xs text-muted-foreground">Push every submission into a Google Sheet tab.</p>
              <Button variant="outline" size="sm">Connect Google Sheets</Button>
            </div>
          </CardContent>
        </Card>

        {/* 12. Invoice */}
        <Card>
          <CardHeader><CardTitle>12 · Invoice</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Invoice Footer Message</Label>
              <Input value={invoiceFooter} onChange={e => setInvoiceFooter(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Receipt Footer Message</Label>
              <Input value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* 13. Notification */}
        <Card>
          <CardHeader><CardTitle>13 · Notification</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label>Emails to receive order notification (separate with comma)*</Label>
            <Input value={notifyEmails} onChange={e => setNotifyEmails(e.target.value)} placeholder="admin@example.com, sales@example.com" />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
