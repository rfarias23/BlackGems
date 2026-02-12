'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DealStage } from '@/components/deals/deal-stage-badge';
import { DealStageSelect } from '@/components/deals/deal-stage-select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Lock,
    Unlock,
    Building2,
    MapPin,
    Users,
    ShieldAlert,
    Edit,
} from 'lucide-react';
import { updateDeal } from '@/lib/actions/deals';
import { ConvertDealDialog } from '@/components/deals/convert-deal-dialog';
import { ArrowRightLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Roles that can edit deals
const EDIT_ROLES = ['SUPER_ADMIN', 'FUND_ADMIN', 'INVESTMENT_MANAGER', 'ANALYST'];

interface DealOverviewProps {
    deal: {
        id: string;
        name: string;
        stage: string;
        industry: string | null;
        askingPrice: string | null;
        revenue: string | null;
        ebitda: string | null;
        ebitdaMargin: string | null;
        description: string | null;
        investmentThesis: string | null;
        keyRisks: string | null;
        valueCreationPlan: string | null;
        yearFounded: number | null;
        employeeCount: number | null;
        city: string | null;
        state: string | null;
        country: string;
        firstContactDate: Date | null;
        ndaSignedDate: Date | null;
        cimReceivedDate: Date | null;
        managementMeetingDate: Date | null;
        loiSubmittedDate: Date | null;
        expectedCloseDate: Date | null;
    };
    userRole: string;
    portfolioLink?: { portfolioId: string } | null;
    rawDeal?: {
        id: string;
        fundId: string;
        companyName: string;
        industry: string | null;
        askingPrice: number | null;
        revenue: number | null;
        ebitda: number | null;
        actualCloseDate: Date | null;
    } | null;
}

function formatDate(date: Date | null): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

function toInputDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

// Inline field with lock/unlock icon
function InlineField({
    label,
    value,
    editValue,
    onChange,
    isEditing,
    type = 'text',
    placeholder,
    prefix,
    className = '',
    textClassName = 'text-2xl font-bold',
}: {
    label?: string;
    value: string;
    editValue: string;
    onChange: (val: string) => void;
    isEditing: boolean;
    type?: string;
    placeholder?: string;
    prefix?: string;
    className?: string;
    textClassName?: string;
}) {
    if (isEditing) {
        return (
            <div className={className}>
                {label && <span className="text-xs text-[#94A3B8] mb-1 block">{label}</span>}
                <div className="flex items-center gap-1.5">
                    <Unlock className="h-3 w-3 text-[#3E5CFF] shrink-0" />
                    <Input
                        type={type}
                        value={editValue}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="h-8 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm focus-visible:ring-[#3E5CFF]"
                    />
                </div>
            </div>
        );
    }
    return (
        <div className={className}>
            {label && <span className="text-xs text-[#94A3B8] mb-1 block">{label}</span>}
            <div className="flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-[#475569] shrink-0" />
                <span className={textClassName}>{prefix}{value}</span>
            </div>
        </div>
    );
}

export function DealOverview({ deal, userRole, portfolioLink, rawDeal }: DealOverviewProps) {
    const canEdit = EDIT_ROLES.includes(userRole);
    const [isEditing, setIsEditing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showConvert, setShowConvert] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const isClosedWon = deal.stage === 'Closed Won';
    const canConvert = isClosedWon && !portfolioLink && canEdit;

    // Editable state
    const [editName, setEditName] = useState(deal.name);
    const [editStage, setEditStage] = useState(deal.stage);
    const [editIndustry, setEditIndustry] = useState(deal.industry || '');
    const [editRevenue, setEditRevenue] = useState((deal.revenue || '').replace(/[$,]/g, ''));
    const [editEbitda, setEditEbitda] = useState((deal.ebitda || '').replace(/[$,]/g, ''));
    const [editAskingPrice, setEditAskingPrice] = useState((deal.askingPrice || '').replace(/[$,]/g, ''));
    const [editDescription, setEditDescription] = useState(deal.description || deal.investmentThesis || '');
    const [editYearFounded, setEditYearFounded] = useState(deal.yearFounded?.toString() || '');
    const [editEmployeeCount, setEditEmployeeCount] = useState(deal.employeeCount?.toString() || '');
    const [editCity, setEditCity] = useState(deal.city || '');
    const [editState, setEditState] = useState(deal.state || '');
    const [editCountry, setEditCountry] = useState(deal.country || '');
    const [editFirstContact, setEditFirstContact] = useState(toInputDate(deal.firstContactDate));
    const [editNdaSigned, setEditNdaSigned] = useState(toInputDate(deal.ndaSignedDate));
    const [editCimReceived, setEditCimReceived] = useState(toInputDate(deal.cimReceivedDate));
    const [editMgmtMeeting, setEditMgmtMeeting] = useState(toInputDate(deal.managementMeetingDate));
    const [editLoiSubmitted, setEditLoiSubmitted] = useState(toInputDate(deal.loiSubmittedDate));
    const [editExpectedClose, setEditExpectedClose] = useState(toInputDate(deal.expectedCloseDate));

    const handleEditClick = () => {
        setShowConfirm(true);
    };

    const handleConfirmEdit = () => {
        setShowConfirm(false);
        setIsEditing(true);
        setError(null);
        // Re-initialize edit state from current props to avoid stale values after a prior save
        setEditName(deal.name);
        setEditStage(deal.stage);
        setEditIndustry(deal.industry || '');
        setEditRevenue((deal.revenue || '').replace(/[$,]/g, ''));
        setEditEbitda((deal.ebitda || '').replace(/[$,]/g, ''));
        setEditAskingPrice((deal.askingPrice || '').replace(/[$,]/g, ''));
        setEditDescription(deal.description || deal.investmentThesis || '');
        setEditYearFounded(deal.yearFounded?.toString() || '');
        setEditEmployeeCount(deal.employeeCount?.toString() || '');
        setEditCity(deal.city || '');
        setEditState(deal.state || '');
        setEditCountry(deal.country || '');
        setEditFirstContact(toInputDate(deal.firstContactDate));
        setEditNdaSigned(toInputDate(deal.ndaSignedDate));
        setEditCimReceived(toInputDate(deal.cimReceivedDate));
        setEditMgmtMeeting(toInputDate(deal.managementMeetingDate));
        setEditLoiSubmitted(toInputDate(deal.loiSubmittedDate));
        setEditExpectedClose(toInputDate(deal.expectedCloseDate));
    };

    const handleDiscard = () => {
        setIsEditing(false);
        setError(null);
        // Reset to original values
        setEditName(deal.name);
        setEditStage(deal.stage);
        setEditIndustry(deal.industry || '');
        setEditRevenue((deal.revenue || '').replace(/[$,]/g, ''));
        setEditEbitda((deal.ebitda || '').replace(/[$,]/g, ''));
        setEditAskingPrice((deal.askingPrice || '').replace(/[$,]/g, ''));
        setEditDescription(deal.description || deal.investmentThesis || '');
        setEditYearFounded(deal.yearFounded?.toString() || '');
        setEditEmployeeCount(deal.employeeCount?.toString() || '');
        setEditCity(deal.city || '');
        setEditState(deal.state || '');
        setEditCountry(deal.country || '');
        setEditFirstContact(toInputDate(deal.firstContactDate));
        setEditNdaSigned(toInputDate(deal.ndaSignedDate));
        setEditCimReceived(toInputDate(deal.cimReceivedDate));
        setEditMgmtMeeting(toInputDate(deal.managementMeetingDate));
        setEditLoiSubmitted(toInputDate(deal.loiSubmittedDate));
        setEditExpectedClose(toInputDate(deal.expectedCloseDate));
    };

    const handleSave = () => {
        setError(null);
        const formData = new FormData();
        formData.set('name', editName);
        formData.set('stage', editStage);
        formData.set('sector', editIndustry);
        formData.set('askPrice', editAskingPrice);
        formData.set('revenue', editRevenue);
        formData.set('ebitda', editEbitda);
        formData.set('description', editDescription);
        formData.set('yearFounded', editYearFounded);
        formData.set('employeeCount', editEmployeeCount);
        formData.set('city', editCity);
        formData.set('state', editState);
        formData.set('country', editCountry);
        formData.set('firstContactDate', editFirstContact);
        formData.set('ndaSignedDate', editNdaSigned);
        formData.set('cimReceivedDate', editCimReceived);
        formData.set('managementMeetingDate', editMgmtMeeting);
        formData.set('loiSubmittedDate', editLoiSubmitted);
        formData.set('expectedCloseDate', editExpectedClose);

        startTransition(async () => {
            const result = await updateDeal(deal.id, formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setIsEditing(false);
            }
        });
    };

    // Compute EBITDA margin in real-time during editing
    const computedMargin = (() => {
        if (!isEditing) return deal.ebitdaMargin || '-';
        const rev = parseFloat(editRevenue.replace(/[$,]/g, ''));
        const ebt = parseFloat(editEbitda.replace(/[$,]/g, ''));
        if (!isNaN(rev) && !isNaN(ebt) && rev > 0) {
            return `${((ebt / rev) * 100).toFixed(1)}%`;
        }
        return '-';
    })();

    return (
        <>
            {/* Edit/Save/Discard controls */}
            {canEdit && (
                <div className="flex items-center gap-2 mb-4">
                    {!isEditing ? (
                        <Button variant="outline" onClick={handleEditClick}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Deal
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={handleSave}
                                disabled={isPending}
                                className="bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90"
                            >
                                {isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDiscard}
                                disabled={isPending}
                            >
                                Discard
                            </Button>
                        </>
                    )}
                </div>
            )}

            {error && (
                <div className="rounded-md p-3 text-sm bg-[#DC2626]/15 text-[#DC2626] mb-4">
                    {error}
                </div>
            )}

            {/* Header info (name, stage, sector) — inline editable */}
            {isEditing && (
                <Card className="mb-4">
                    <CardContent className="pt-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <InlineField
                                label="Company Name"
                                value={deal.name}
                                editValue={editName}
                                onChange={setEditName}
                                isEditing={isEditing}
                                textClassName="text-sm font-medium"
                            />
                            <div>
                                <span className="text-xs text-[#94A3B8] mb-1 block">Stage</span>
                                <div className="flex items-center gap-1.5">
                                    <Unlock className="h-3 w-3 text-[#3E5CFF] shrink-0" />
                                    <DealStageSelect
                                        value={editStage as DealStage}
                                        onValueChange={setEditStage}
                                        className="h-8 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm"
                                    />
                                </div>
                            </div>
                            <InlineField
                                label="Sector"
                                value={deal.industry || '-'}
                                editValue={editIndustry}
                                onChange={setEditIndustry}
                                isEditing={isEditing}
                                placeholder="Agribusiness"
                                textClassName="text-sm font-medium"
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Financial Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue (LTM)</CardTitle>
                        {isEditing ? (
                            <Unlock className="h-3.5 w-3.5 text-[#3E5CFF]" />
                        ) : (
                            <Lock className="h-3.5 w-3.5 text-[#475569]" />
                        )}
                    </CardHeader>
                    <CardContent>
                        {isEditing ? (
                            <Input
                                value={editRevenue}
                                onChange={(e) => setEditRevenue(e.target.value)}
                                placeholder="$10,000,000"
                                className="h-9 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-lg font-bold focus-visible:ring-[#3E5CFF]"
                            />
                        ) : (
                            <div className="text-2xl font-bold">{deal.revenue || 'TBD'}</div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">EBITDA (LTM)</CardTitle>
                        {isEditing ? (
                            <Unlock className="h-3.5 w-3.5 text-[#3E5CFF]" />
                        ) : (
                            <Lock className="h-3.5 w-3.5 text-[#475569]" />
                        )}
                    </CardHeader>
                    <CardContent>
                        {isEditing ? (
                            <Input
                                value={editEbitda}
                                onChange={(e) => setEditEbitda(e.target.value)}
                                placeholder="$2,500,000"
                                className="h-9 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-lg font-bold focus-visible:ring-[#3E5CFF]"
                            />
                        ) : (
                            <div className="text-2xl font-bold">{deal.ebitda || 'TBD'}</div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">EBITDA Margin</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">{computedMargin}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Asking Price</CardTitle>
                        {isEditing ? (
                            <Unlock className="h-3.5 w-3.5 text-[#3E5CFF]" />
                        ) : (
                            <Lock className="h-3.5 w-3.5 text-[#475569]" />
                        )}
                    </CardHeader>
                    <CardContent>
                        {isEditing ? (
                            <Input
                                value={editAskingPrice}
                                onChange={(e) => setEditAskingPrice(e.target.value)}
                                placeholder="$35,000,000"
                                className="h-9 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-lg font-bold focus-visible:ring-[#3E5CFF]"
                            />
                        ) : (
                            <div className="text-2xl font-bold text-muted-foreground">{deal.askingPrice || 'TBD'}</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Investment Thesis + Key Dates */}
            <div className="grid gap-4 md:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Investment Thesis</CardTitle>
                        {isEditing ? (
                            <Unlock className="h-3.5 w-3.5 text-[#3E5CFF]" />
                        ) : (
                            <Lock className="h-3.5 w-3.5 text-[#475569]" />
                        )}
                    </CardHeader>
                    <CardContent>
                        {isEditing ? (
                            <Textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Describe the investment thesis..."
                                rows={5}
                                className="bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm resize-none focus-visible:ring-[#3E5CFF]"
                            />
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {deal.description || deal.investmentThesis || 'No description provided yet.'}
                                </p>
                                {deal.keyRisks && (
                                    <div className="mt-4 space-y-2">
                                        <h4 className="text-sm font-semibold">Key Risks:</h4>
                                        <p className="text-sm text-muted-foreground">{deal.keyRisks}</p>
                                    </div>
                                )}
                                {deal.valueCreationPlan && (
                                    <div className="mt-4 space-y-2">
                                        <h4 className="text-sm font-semibold">Value Creation Plan:</h4>
                                        <p className="text-sm text-muted-foreground">{deal.valueCreationPlan}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Key Dates</CardTitle>
                        {isEditing ? (
                            <Unlock className="h-3.5 w-3.5 text-[#3E5CFF]" />
                        ) : (
                            <Lock className="h-3.5 w-3.5 text-[#475569]" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                { label: 'First Contact', value: deal.firstContactDate, editValue: editFirstContact, onChange: setEditFirstContact },
                                { label: 'NDA Signed', value: deal.ndaSignedDate, editValue: editNdaSigned, onChange: setEditNdaSigned },
                                { label: 'CIM Received', value: deal.cimReceivedDate, editValue: editCimReceived, onChange: setEditCimReceived },
                                { label: 'Mgmt Meeting', value: deal.managementMeetingDate, editValue: editMgmtMeeting, onChange: setEditMgmtMeeting },
                                { label: 'LOI Submitted', value: deal.loiSubmittedDate, editValue: editLoiSubmitted, onChange: setEditLoiSubmitted },
                                { label: 'Expected Close', value: deal.expectedCloseDate, editValue: editExpectedClose, onChange: setEditExpectedClose },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{item.label}</span>
                                    {isEditing ? (
                                        <Input
                                            type="date"
                                            value={item.editValue}
                                            onChange={(e) => item.onChange(e.target.value)}
                                            className="h-7 w-40 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-xs focus-visible:ring-[#3E5CFF]"
                                        />
                                    ) : (
                                        <span className="font-medium">{formatDate(item.value)}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Company Details */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Company Details</CardTitle>
                    {isEditing ? (
                        <Unlock className="h-3.5 w-3.5 text-[#3E5CFF]" />
                    ) : (
                        <Lock className="h-3.5 w-3.5 text-[#475569]" />
                    )}
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <div className="grid gap-4 md:grid-cols-5">
                            <InlineField
                                label="Founded"
                                value={deal.yearFounded?.toString() || '-'}
                                editValue={editYearFounded}
                                onChange={setEditYearFounded}
                                isEditing={isEditing}
                                type="number"
                                placeholder="1990"
                                textClassName="text-sm font-medium"
                            />
                            <InlineField
                                label="Employees"
                                value={deal.employeeCount?.toString() || '-'}
                                editValue={editEmployeeCount}
                                onChange={setEditEmployeeCount}
                                isEditing={isEditing}
                                type="number"
                                placeholder="250"
                                textClassName="text-sm font-medium"
                            />
                            <InlineField
                                label="City"
                                value={deal.city || '-'}
                                editValue={editCity}
                                onChange={setEditCity}
                                isEditing={isEditing}
                                placeholder="Lima"
                                textClassName="text-sm font-medium"
                            />
                            <InlineField
                                label="State"
                                value={deal.state || '-'}
                                editValue={editState}
                                onChange={setEditState}
                                isEditing={isEditing}
                                placeholder="Lima"
                                textClassName="text-sm font-medium"
                            />
                            <InlineField
                                label="Country"
                                value={deal.country || '-'}
                                editValue={editCountry}
                                onChange={setEditCountry}
                                isEditing={isEditing}
                                placeholder="Peru"
                                textClassName="text-sm font-medium"
                            />
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    <span className="text-muted-foreground">Founded:</span>{' '}
                                    <span className="font-medium">{deal.yearFounded || '-'}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    <span className="text-muted-foreground">Employees:</span>{' '}
                                    <span className="font-medium">{deal.employeeCount || '-'}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    <span className="text-muted-foreground">Location:</span>{' '}
                                    <span className="font-medium">
                                        {[deal.city, deal.state, deal.country].filter(Boolean).join(', ') || '-'}
                                    </span>
                                </span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Portfolio Conversion Banner */}
            {isClosedWon && (
                <Card className={portfolioLink ? 'border-emerald-500/30' : 'border-[#3E5CFF]/30'}>
                    <CardContent className="pt-4 pb-4">
                        {portfolioLink ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ArrowRightLeft className="h-4 w-4 text-emerald-500" />
                                    <span className="text-sm font-medium">Portfolio company created from this deal</span>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/portfolio/${portfolioLink.portfolioId}`}>
                                        View Portfolio Company
                                        <ExternalLink className="ml-2 h-3 w-3" />
                                    </Link>
                                </Button>
                            </div>
                        ) : canConvert && rawDeal ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ArrowRightLeft className="h-4 w-4 text-[#3E5CFF]" />
                                    <span className="text-sm font-medium">This deal is closed — ready to convert to a portfolio company</span>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => setShowConvert(true)}
                                    className="bg-[#3E5CFF] text-white hover:bg-[#3E5CFF]/90"
                                >
                                    <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />
                                    Convert to Portfolio
                                </Button>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            )}

            {/* Convert Deal Dialog */}
            {canConvert && rawDeal && (
                <ConvertDealDialog
                    dealId={rawDeal.id}
                    companyName={rawDeal.companyName}
                    askingPrice={rawDeal.askingPrice}
                    revenue={rawDeal.revenue}
                    ebitda={rawDeal.ebitda}
                    industry={rawDeal.industry}
                    actualCloseDate={rawDeal.actualCloseDate}
                    open={showConvert}
                    onOpenChange={setShowConvert}
                />
            )}

            {/* Confirmation Dialog */}
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="bg-[#1E293B] text-[#F8FAFC] border-[#334155]">
                    <DialogHeader>
                        <DialogTitle className="text-[#F8FAFC] flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-amber-400" />
                            Enable Edit Mode
                        </DialogTitle>
                        <DialogDescription className="text-[#94A3B8] pt-2">
                            You are about to modify critical deal data. All changes will be recorded in the audit log and attributed to your account.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowConfirm(false)}
                            className="border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmEdit}
                            className="bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90"
                        >
                            Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
