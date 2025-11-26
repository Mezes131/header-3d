import {
  CARD_HALF_HEIGHT,
  CARD_HALF_WIDTH,
  HEART_CONNECT_Y,
  PARENT_ROW_Y,
  CHILD_ROW_Y,
  PARENT_X_OFFSET,
} from '../constants/layout';

const leftParentPosition = [-PARENT_X_OFFSET, PARENT_ROW_Y, 0];
const rightParentPosition = [PARENT_X_OFFSET, PARENT_ROW_Y, 0];
const childPosition = [0, CHILD_ROW_Y, 0];

const leftParentExit = [leftParentPosition[0] + CARD_HALF_WIDTH, PARENT_ROW_Y, 0];
const rightParentExit = [rightParentPosition[0] - CARD_HALF_WIDTH, PARENT_ROW_Y, 0];
const unionAnchor = [0, HEART_CONNECT_Y, 0];
const childTop = [0, childPosition[1] + CARD_HALF_HEIGHT, 0];

export const people = [
  {
    id: 'jean',
    firstName: 'Jean',
    lastName: 'Newton',
    birthDate: '13/11/1985',
    gender: 'male',
    generation: 0,
    position: leftParentPosition,
  },
  {
    id: 'jeanne',
    firstName: 'Jeanne',
    lastName: 'Newton',
    birthDate: '08/09/1998',
    gender: 'female',
    generation: 0,
    position: rightParentPosition,
  },
  {
    id: 'junior',
    firstName: 'Junior',
    lastName: 'Newton',
    birthDate: '14/02/2017',
    gender: 'male',
    generation: 1,
    position: childPosition,
  },
];

export const links = [
  {
    id: 'parents-union-left',
    start: leftParentExit,
    end: unionAnchor,
  },
  {
    id: 'parents-union-right',
    start: rightParentExit,
    end: unionAnchor,
  },
  {
    id: 'union-child',
    start: unionAnchor,
    end: childTop,
  },
];

