import React from 'react';
import renderer from 'react-test-renderer';

import Stage from '.';

describe('Stage', () => {
  test('It renders', () => {
    const component = renderer.create(<Stage />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
