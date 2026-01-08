import EmailNode from './CustomNodes/EmailNode';
import SMSNode from './CustomNodes/SMSNode';
import PhoneNode from './CustomNodes/PhoneNode';
import TriggerNode from './CustomNodes/TriggerNode';
import ConditionNode from './CustomNodes/ConditionNode';
import DelayNode from './CustomNodes/DelayNode';
import SplitNode from './CustomNodes/SplitNode';
import ScheduleNode from './CustomNodes/ScheduleNode';
import TargetGroupNode from './CustomNodes/TargetGroupNode';

export const nodeTypes = {
  email: EmailNode,
  sms: SMSNode,
  phone: PhoneNode,
  trigger: TriggerNode,
  condition: ConditionNode,
  delay: DelayNode,
  split: SplitNode,
  schedule: ScheduleNode,
  targetGroup: TargetGroupNode,
};

