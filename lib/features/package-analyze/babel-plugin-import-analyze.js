"use strict";

module.exports = function () {
  return {
    visitor: {
      CallExpression: {
        enter(path, state) {
          const onCollect = state.opts.onCollect;
          const node = path.node; // require & import()

          if (node.callee.type === 'Identifier' && node.callee.name === 'require' || node.callee.type === 'Import') {
            const dependencies = node.arguments.map(({
              type,
              value
            }) => {
              if (type === 'StringLiteral') return value;
            }).filter(Boolean);

            if (dependencies[0]) {
              onCollect(state.filename, dependencies[0]);
            }
          }
        }

      },
      ImportDeclaration: {
        enter(path, state) {
          const node = path.node;
          const onCollect = state.opts.onCollect;
          onCollect(state.filename, node.source.value);
        }

      }
    }
  };
};