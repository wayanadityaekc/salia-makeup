const ABBREVIATION_RENAMES = { el: 'element', err: 'error' };
const BANNED_SHORT_NAMES = ['el', 'dt', 'q', 'r', 'd', 'c', 'p', 'res', 'err'];
const ARRAY_CALLBACK_METHODS = new Set([
  'map',
  'filter',
  'forEach',
  'find',
  'findIndex',
  'some',
  'every',
  'flatMap',
  'findLast',
]);
const FUNCTION_TYPES = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);

function isFunctionNode(node) {
  return Boolean(node) && FUNCTION_TYPES.has(node.type);
}

function containsLexicalThis(rootNode) {
  let hasLexicalThis = false;
  function visit(node) {
    const isOutsideFunctionScope = hasLexicalThis || !node || typeof node.type !== 'string';
    if (isOutsideFunctionScope) return;
    const isNestedFunctionBoundary =
      node !== rootNode && (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration');
    if (isNestedFunctionBoundary) return;
    const isThisLike =
      node.type === 'ThisExpression' ||
      node.type === 'Super' ||
      node.type === 'MetaProperty' ||
      (node.type === 'Identifier' && node.name === 'arguments');
    if (isThisLike) {
      hasLexicalThis = true;
      return;
    }
    Object.keys(node).forEach((key) => {
      if (key === 'parent') return;
      const child = node[key];
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child.type === 'string') visit(child);
    });
  }
  visit(rootNode);
  return hasLexicalThis;
}

function isConvertiblePlacement(declaration, isModule) {
  const holder = declaration.parent.type === 'ExportNamedDeclaration' ? declaration.parent : declaration;
  const container = holder.parent;
  if (container.type === 'Program') return true;
  if (container.type !== 'BlockStatement') return false;
  return isModule || isFunctionNode(container.parent);
}

function buildFunctionDeclaration(sourceCode, declaration) {
  const declarator = declaration.declarations[0];
  const name = declarator.id.name;
  const functionNode = declarator.init;
  const asyncPrefix = functionNode.async ? 'async ' : '';
  const star = functionNode.generator ? '*' : '';
  const tokens = sourceCode.getTokens(functionNode);
  let paramsText;
  if (functionNode.params.length === 0) {
    paramsText = '()';
  } else {
    const firstParam = functionNode.params[0];
    const lastParam = functionNode.params[functionNode.params.length - 1];
    const before = sourceCode.getTokenBefore(firstParam);
    const after = sourceCode.getTokenAfter(lastParam, { filter: (token) => token.value !== ',' });
    const isParenthesized = before.value === '(' && after.value === ')';
    paramsText = isParenthesized
      ? sourceCode.text.slice(before.range[0], after.range[1])
      : `(${sourceCode.text.slice(firstParam.range[0], lastParam.range[1])})`;
  }
  if (!tokens.length) return null;
  let bodyText;
  if (functionNode.body.type === 'BlockStatement') bodyText = sourceCode.getText(functionNode.body);
  else bodyText = `{\n  return (${sourceCode.getText(functionNode.body)});\n}`;
  const exportPrefix = declaration.parent.type === 'ExportNamedDeclaration' ? 'export ' : '';
  return { text: `${exportPrefix}${asyncPrefix}function${star} ${name}${paramsText} ${bodyText}`, exportPrefix };
}

const functionDeclarationRule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: { description: 'Named function declarations, not functions assigned to variables' },
    schema: [],
  },
  create(context) {
    const { sourceCode } = context;
    return {
      VariableDeclarator(declarator) {
        const functionNode = declarator.init;
        if (!functionNode || declarator.id.type !== 'Identifier') return;
        const isArrow = functionNode.type === 'ArrowFunctionExpression';
        const isAnonymousExpression =
          functionNode.type === 'FunctionExpression' &&
          (!functionNode.id || functionNode.id.name === declarator.id.name);
        if (!isArrow && !isAnonymousExpression) return;
        const declaration = declarator.parent;
        const canFix =
          declaration.kind === 'const' &&
          declaration.declarations.length === 1 &&
          isConvertiblePlacement(declaration, context.languageOptions.sourceType === 'module') &&
          !(isArrow && containsLexicalThis(functionNode));
        const report = { node: declarator, message: `Use a function declaration for ${declarator.id.name}.` };
        if (canFix) {
          const built = buildFunctionDeclaration(sourceCode, declaration);
          if (built) {
            const target = built.exportPrefix ? declaration.parent : declaration;
            report.fix = (fixer) => fixer.replaceText(target, built.text);
          }
        }
        context.report(report);
      },
    };
  },
};

function isNameReferencedInside(sourceCode, node, name) {
  const pattern = new RegExp(`(^|[^\\w$.])${name.replace('$', '\\$')}(?![\\w$])`);
  return pattern.test(sourceCode.getText(node));
}

function isShorthandProperty(identifier) {
  const parent = identifier.parent;
  const isShorthandPropertyValue =
    parent && parent.type === 'Property' && parent.shorthand && parent.value === identifier;
  if (isShorthandPropertyValue) return true;
  const isAssignmentDefaultTarget = parent && parent.type === 'AssignmentPattern' && parent.left === identifier;
  if (isAssignmentDefaultTarget) {
    const grand = parent.parent;
    return Boolean(grand && grand.type === 'Property' && grand.shorthand && grand.value === parent);
  }
  return false;
}

function buildIdentifierRenameFix(fixer, identifier, oldName, newName) {
  if (isShorthandProperty(identifier)) return fixer.replaceText(identifier, `${oldName}: ${newName}`);
  return fixer.replaceText(identifier, newName);
}

function collectIdentifiers(variable) {
  const identifiers = new Set(variable.identifiers);
  variable.references.forEach((reference) => identifiers.add(reference.identifier));
  return [...identifiers];
}

function isExportedOrImported(variable) {
  return (
    variable.defs.some((definition) => definition.type === 'ImportBinding') ||
    variable.references.some((reference) => {
      const parent = reference.identifier.parent;
      return parent && (parent.type === 'ExportSpecifier' || parent.type === 'ExportDefaultDeclaration');
    }) ||
    variable.defs.some((definition) => {
      const declaration = definition.parent;
      return declaration && declaration.parent && declaration.parent.type === 'ExportNamedDeclaration';
    })
  );
}

const catchParamRule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: { description: 'The catch error variable is always e' },
    schema: [],
  },
  create(context) {
    const { sourceCode } = context;
    return {
      CatchClause(node) {
        if (!node.param) return;
        if (node.param.type !== 'Identifier') {
          context.report({ node: node.param, message: 'Name the catch error variable e.' });
          return;
        }
        const oldName = node.param.name;
        if (oldName === 'e') return;
        const variable = sourceCode.getDeclaredVariables(node)[0];
        const report = { node: node.param, message: `Name the catch error variable e, not ${oldName}.` };
        const isSafe = variable && !isNameReferencedInside(sourceCode, node.body, 'e');
        if (isSafe) {
          report.fix = (fixer) =>
            collectIdentifiers(variable).map((identifier) => buildIdentifierRenameFix(fixer, identifier, oldName, 'e'));
        }
        context.report(report);
      },
    };
  },
};

function findSingular(pluralName) {
  if (/ies$/.test(pluralName)) return pluralName.replace(/ies$/, 'y');
  if (/(ss|us|is)$/.test(pluralName)) return null;
  if (/(sh|ch|x|ses)es$/.test(pluralName)) return pluralName.replace(/es$/, '');
  if (/s$/.test(pluralName)) return pluralName.replace(/s$/, '');
  return null;
}

function findCollectionName(node) {
  if (node.type === 'Identifier') return node.name;
  const isPlainPropertyAccess =
    node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier';
  if (isPlainPropertyAccess) return node.property.name;
  return null;
}

function unwrapCall(node) {
  let call = node && node.type === 'AwaitExpression' ? node.argument : node;
  const isCatchWrapper =
    call &&
    call.type === 'CallExpression' &&
    call.callee.type === 'MemberExpression' &&
    !call.callee.computed &&
    call.callee.property.name === 'catch';
  if (isCatchWrapper) call = call.callee.object;
  return call;
}

function isCallTo(node, calleeName) {
  const call = unwrapCall(node);
  if (!call || call.type !== 'CallExpression') return false;
  const callee = call.callee;
  if (callee.type === 'Identifier') return callee.name === calleeName;
  return callee.type === 'MemberExpression' && !callee.computed && callee.property.name === calleeName;
}

function suggestNameFor(variable) {
  if (ABBREVIATION_RENAMES[variable.name]) return ABBREVIATION_RENAMES[variable.name];
  const definition = variable.defs[0];
  if (!definition) return null;
  if (variable.name === 'res') {
    const isFetchResult =
      definition.type === 'Variable' &&
      (isCallTo(definition.node.init, 'fetch') || isCallTo(definition.node.init, 'apiFetch'));
    const pattern = definition.name.parent && definition.name.parent.parent;
    const isInPatternWithReq =
      Boolean(pattern) &&
      pattern.type === 'ObjectPattern' &&
      pattern.properties.some((property) => property.key && property.key.name === 'req');
    const isHandlerParam =
      definition.type === 'Parameter' &&
      (isInPatternWithReq ||
        definition.node.params.some((param) => param.type === 'Identifier' && param.name === 'req'));
    return isFetchResult || isHandlerParam ? 'response' : 'result';
  }
  if (definition.type === 'Variable' && definition.node.id.type === 'Identifier') {
    const init = definition.node.init;
    if (isCallTo(init, 'fetch') || isCallTo(init, 'apiFetch')) return 'response';
    if (isCallTo(init, 'json')) return 'data';
    if (isCallTo(init, 'querySelector') || isCallTo(init, 'getElementById')) return 'element';
    return null;
  }
  if (definition.type !== 'Parameter') return null;
  const functionNode = definition.node;
  if (functionNode.params[0] !== definition.name) return null;
  const call = functionNode.parent;
  const isArrayCallback =
    call &&
    call.type === 'CallExpression' &&
    call.arguments[0] === functionNode &&
    call.callee.type === 'MemberExpression' &&
    !call.callee.computed &&
    ARRAY_CALLBACK_METHODS.has(call.callee.property.name);
  if (!isArrayCallback) return null;
  const collectionName = findCollectionName(call.callee.object);
  const singular = collectionName && findSingular(collectionName);
  const isSingularNameInvalid = !singular || singular.length < 3 || BANNED_SHORT_NAMES.includes(singular);
  if (isSingularNameInvalid) return null;
  return singular;
}

function findVariableScopeBlock(variable) {
  return variable.scope.block;
}

const descriptiveNamesRule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: { description: 'No cryptic letters or abbreviations' },
    schema: [],
  },
  create(context) {
    const { sourceCode } = context;
    function checkScope(scope) {
      scope.variables.forEach((variable) => {
        if (!BANNED_SHORT_NAMES.includes(variable.name)) return;
        if (!variable.identifiers.length) return;
        if (variable.defs.some((definition) => definition.type === 'CatchClause')) return;
        const newName = suggestNameFor(variable);
        const report = {
          node: variable.identifiers[0],
          message: `Use a descriptive name instead of ${variable.name}.`,
        };
        const block = findVariableScopeBlock(variable);
        const isSafe =
          newName &&
          !isExportedOrImported(variable) &&
          !isNameReferencedInside(sourceCode, block, newName) &&
          variable.references.every((reference) => {
            const parent = reference.identifier.parent;
            return !(parent && parent.type === 'JSXMemberExpression');
          });
        if (isSafe) {
          report.fix = (fixer) =>
            collectIdentifiers(variable).map((identifier) =>
              buildIdentifierRenameFix(fixer, identifier, variable.name, newName),
            );
        }
        context.report(report);
      });
      scope.childScopes.forEach(checkScope);
    }
    return {
      'Program:exit'(node) {
        checkScope(sourceCode.getScope(node));
      },
    };
  },
};

const noThenRule = {
  meta: { type: 'suggestion', docs: { description: 'async/await, never .then() chains' }, schema: [] },
  create(context) {
    return {
      'CallExpression > MemberExpression.callee[property.name="then"]'(node) {
        context.report({ node: node.property, message: 'Use async/await instead of .then().' });
      },
    };
  },
};

const noSwitchRule = {
  meta: { type: 'suggestion', docs: { description: 'if/else, never switch' }, schema: [] },
  create(context) {
    return {
      SwitchStatement(node) {
        context.report({ node, message: 'Use if/else instead of switch.' });
      },
    };
  },
};

const noCommentsRule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: { description: 'Zero comments: the code explains itself through its names' },
    schema: [],
  },
  create(context) {
    const { sourceCode } = context;
    const text = sourceCode.text;
    function findLineBounds(index) {
      const lineStart = text.lastIndexOf('\n', index - 1) + 1;
      let lineEnd = text.indexOf('\n', index);
      if (lineEnd === -1) lineEnd = text.length;
      return [lineStart, lineEnd];
    }
    function buildCommentRemoval(comment) {
      const found = sourceCode.getNodeByRangeIndex(comment.range[0]);
      const node = found && found.type === 'JSXEmptyExpression' ? found.parent : found;
      const isOnlyJsxChild =
        node && node.type === 'JSXExpressionContainer' && node.expression.type === 'JSXEmptyExpression';
      const range = isOnlyJsxChild ? node.range : comment.range;
      const [lineStart] = findLineBounds(range[0]);
      const [, lineEnd] = findLineBounds(range[1]);
      const before = text.slice(lineStart, range[0]);
      const after = text.slice(range[1], lineEnd);
      if (!before.trim() && !after.trim()) {
        return { range: [lineStart, Math.min(lineEnd + 1, text.length)], replacement: '' };
      }
      const removed = text.slice(range[0], range[1]);
      if (isOnlyJsxChild) return { range, replacement: '' };
      if (!after.trim()) {
        const trimmedStart = range[0] - (before.length - before.trimEnd().length);
        return { range: [trimmedStart, range[1]], replacement: removed.includes('\n') ? '\n' : '' };
      }
      return { range, replacement: removed.includes('\n') ? '\n' : ' ' };
    }
    return {
      Program() {
        const comments = sourceCode.getAllComments().filter((comment) => comment.type !== 'Shebang');
        comments.forEach((comment) => {
          const removal = buildCommentRemoval(comment);
          context.report({
            loc: comment.loc,
            message: 'Remove this comment: the code explains itself through its names.',
            fix: (fixer) => fixer.replaceTextRange(removal.range, removal.replacement),
          });
        });
      },
    };
  },
};

export const plugin = {
  meta: { name: 'cahyana' },
  rules: {
    'no-comments': noCommentsRule,
    'function-declaration': functionDeclarationRule,
    'catch-param-e': catchParamRule,
    'descriptive-names': descriptiveNamesRule,
    'no-then': noThenRule,
    'no-switch': noSwitchRule,
  },
};

export function cahyanaConfig({
  files,
  globals = {},
  sourceType = 'module',
  ignores = [],
  extraRules = {},
  commonjsFiles = [],
}) {
  const commonjsBlock = commonjsFiles.length
    ? [{ files: commonjsFiles, languageOptions: { sourceType: 'commonjs' } }]
    : [];
  return [
    { ignores: ['**/node_modules/**', '**/.next/**', '**/out/**', '**/public/**', '**/.turbo/**', ...ignores] },
    {
      files,
      plugins: { cahyana: plugin },
      linterOptions: { reportUnusedDisableDirectives: 'off' },
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType,
        globals,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      rules: {
        'cahyana/no-comments': 'error',
        'cahyana/catch-param-e': 'error',
        'cahyana/no-switch': 'error',
        'cahyana/function-declaration': 'warn',
        'cahyana/descriptive-names': 'warn',
        'cahyana/no-then': 'warn',
        'prefer-template': 'error',
        'prefer-object-spread': 'error',
        'no-restricted-syntax': [
          'warn',
          { selector: 'ForStatement', message: 'Use an array method instead of a for loop.' },
          { selector: 'ForInStatement', message: 'Use Object.keys/entries with an array method.' },
        ],
        ...extraRules,
      },
    },
    ...commonjsBlock,
  ];
}
