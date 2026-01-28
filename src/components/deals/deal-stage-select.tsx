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
                        <div className="flex items-center">
                            <DealStageBadge stage={stage} className="mr-2" />
                            {/* Force text color for select item to be readable */}
                            <span className="opacity-0 w-0 h-0 overflow-hidden">{stage}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
