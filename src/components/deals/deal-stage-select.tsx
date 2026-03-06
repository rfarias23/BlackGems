import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DealStageBadge, DealStage } from './deal-stage-badge';

const STAGES: DealStage[] = [
    'Identified',
    'Initial Review',
    'NDA Signed',
    'IOI Submitted',
    'LOI Negotiation',
    'Due Diligence',
    'Closing',
    'Closed Won',
    'Closed Lost',
    'On Hold',
];

interface DealStageSelectProps {
    value?: DealStage;
    onValueChange: (value: DealStage) => void;
    placeholder?: string;
    className?: string;
}

export function DealStageSelect({
    value,
    onValueChange,
    placeholder = 'Select Stage',
    className,
}: DealStageSelectProps) {
    return (
        <Select value={value} onValueChange={(val) => onValueChange(val as DealStage)}>
            <SelectTrigger className={className}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                        <div className="flex items-center gap-2">
                            <DealStageBadge stage={stage} />
                            <span className="text-[#F8FAFC]">{stage}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
