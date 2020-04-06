import React from 'react';
import renderer from 'react-test-renderer';

import Scatter from '.';

describe('Scatter', () => {
  test('It renders', () => {
    const component = renderer.create(<Scatter />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
