import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

import {
  minimumDesktopStoryFrame,
  popularMobileStoryFrame,
  type StoryFrame,
} from '@ui/components/__mocks__/storyFrames';

import allMetMock from './__mocks__/allMet.json';
import fourOperationsMixedMock from './__mocks__/fourOperationsMixed.json';
import noneMetMock from './__mocks__/noneMet.json';
import partiallyMetMock from './__mocks__/partiallyMet.json';
import singleOperationMock from './__mocks__/singleOperation.json';
import zeroProgressMock from './__mocks__/zeroProgress.json';
import { GradeRequirementsList } from '.';

type GradeRequirementsMock = Pick<ComponentProps<typeof GradeRequirementsList>, 'grade' | 'operations'>;

/** Component props plus the device frame used to size the surrounding panel. */
type GradeRequirementsListStoryArgs = ComponentProps<typeof GradeRequirementsList> & {
  frame?: StoryFrame;
};

const label = 'Grade requirements by operation';

// JSON imports widen string literals, so narrow them to the component's prop types once here.
const noneMet = noneMetMock as GradeRequirementsMock;
const partiallyMet = partiallyMetMock as GradeRequirementsMock;
const allMet = allMetMock as GradeRequirementsMock;
const zeroProgress = zeroProgressMock as GradeRequirementsMock;
const fourOperationsMixed = fourOperationsMixedMock as GradeRequirementsMock;
const singleOperation = singleOperationMock as GradeRequirementsMock;

const meta = {
  title: 'Components/GradeRequirementsList',
  component: GradeRequirementsList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story, context) => {
      const { frame = minimumDesktopStoryFrame } = context.args;

      // Panel width matches the overlay panels the list is rendered in (16px side gutter).
      return (
        <div className="overlay-panel" style={{ width: `${frame.width - 32}px` }}>
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<GradeRequirementsListStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NoneMet: Story = {
  name: 'No requirements met',
  args: { ...noneMet, label },
};

export const PartiallyMet: Story = {
  name: 'Some requirements met',
  args: { ...partiallyMet, label },
};

export const AllMet: Story = {
  name: 'All requirements met (Major-General hold)',
  args: { ...allMet, label },
};

export const ZeroProgress: Story = {
  name: 'Fresh player, zero progress',
  args: { ...zeroProgress, label },
};

export const FourOperationsMixed: Story = {
  name: 'Four operations, mixed progress',
  args: { ...fourOperationsMixed, label },
};

export const Empty: Story = {
  name: 'No requirements',
  args: { grade: 'trainee', operations: [], label },
};

export const MobileNoneMet: Story = {
  name: 'Mobile no requirements met',
  args: { ...noneMet, label, frame: popularMobileStoryFrame },
};

export const MobilePartiallyMet: Story = {
  name: 'Mobile some requirements met',
  args: { ...partiallyMet, label, frame: popularMobileStoryFrame },
};

export const MobileAllMet: Story = {
  name: 'Mobile all requirements met (Major-General hold)',
  args: { ...allMet, label, frame: popularMobileStoryFrame },
};

export const MobileFourOperationsMixed: Story = {
  name: 'Mobile four operations, mixed progress',
  args: { ...fourOperationsMixed, label, frame: popularMobileStoryFrame },
};

export const SingleOperation: Story = {
  name: 'Single operation',
  args: { ...singleOperation, label },
};

export const MobileZeroProgress: Story = {
  name: 'Mobile fresh player, zero progress',
  args: { ...zeroProgress, label, frame: popularMobileStoryFrame },
};

export const MobileSingleOperation: Story = {
  name: 'Mobile single operation',
  args: { ...singleOperation, label, frame: popularMobileStoryFrame },
};
