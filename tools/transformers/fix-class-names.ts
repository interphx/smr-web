import * as ts from 'typescript';

function createVisitor(ctx: ts.TransformationContext) {
    const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
        if (ts.isClassDeclaration(node) && node.name) {
            /*const fixClassNameStatement = ts.createStatement(
                ts.createAssignment(
                    ts.createPropertyAccess(node.name, 'componentName'),
                    ts.createStringLiteral(node.name.getText())
                )
            );
            return [ts.visitEachChild(node, visitor, ctx), fixClassNameStatement];*/
        }

        return ts.visitEachChild(node, visitor, ctx);
    }

    return visitor;
}

export function createTransformer() {
    return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return (sf: ts.SourceFile) => ts.visitNode(sf, createVisitor(ctx));
    };
}