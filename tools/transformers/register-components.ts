import * as ts from 'typescript';

interface ComponentItem {
    componentName: string;
    modulePath: string;
}

function createBeforeVisitor(ctx: ts.TransformationContext, itemStorage: ComponentItem[]) {
    const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
        if (ts.isClassDeclaration(node) && node.name) {
            const filePath = node.getSourceFile().fileName;
            const match = filePath.match(/components[\/\\][a-zA-Z0-9_\-\\\/]+\.tsx?$/);
            
            if (match && match[0]) {
                const modulePath = match[0];
                const componentName = node.name.getText();
                itemStorage.push({ modulePath, componentName });
            }
        }

        return ts.visitEachChild(node, visitor, ctx);
    }
    return visitor;
}

function createAfterVisitor(ctx: ts.TransformationContext, itemStorage: ComponentItem[]) {
    const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
        console.log('after', itemStorage);
        if (
            node.getSourceFile() &&
            node.getSourceFile().fileName.match(/[\\\/]setup\.ts$/) &&
            ts.isFunctionDeclaration(node)                          &&
            node.name                                               &&
            node.name.getText() === 'setup'
        ) {
            console.log(`!!!!!!!!!!!!!Found setup!!!!!!!!!!!!!`, itemStorage);
            const statements = itemStorage.map(item => ts.createStatement(
                ts.createCall(
                    ts.createPropertyAccess(ts.createIdentifier('storage'), 'registerComponentType'),
                    [],
                    [ts.createIdentifier(item.componentName)]
                )
            ));
            return ts.createFunctionDeclaration(
                [],
                [],
                undefined,
                node.name,
                node.typeParameters,
                node.parameters,
                node.type,
                ts.createBlock(statements)
            )
        }

        return ts.visitEachChild(node, visitor, ctx);
    }

    return visitor;
}

export function createTransformers() {
    const items: ComponentItem[] = [];
    return {
        before: (ctx: ts.TransformationContext) => (sf: ts.SourceFile) => ts.visitNode(sf, createBeforeVisitor(ctx, items)),
        after: (ctx: ts.TransformationContext) => (sf: ts.SourceFile) => ts.visitNode(sf, createAfterVisitor(ctx, items)),
    } as {
        before: (ctx: ts.TransformationContext) => ts.Transformer<ts.SourceFile>,
        after: (ctx: ts.TransformationContext) => ts.Transformer<ts.SourceFile>
    };
}